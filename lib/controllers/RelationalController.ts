import { CRUDController } from 'kuzzle-plugin-commons';
import {
  KDocument,
  KDocumentContentGeneric,
  KHit,
  KuzzleRequest,
  Plugin,
  SearchResult
} from 'kuzzle';
import { User } from 'kuzzle/lib/types';
import { KDocumentContent } from 'kuzzle-sdk';

/**
 * interface to indicate a specific field in a specific document.
 * Used to indicate field used to represent relation
 */
export interface FieldPath {
  'index' : string,
  'collection' : string,
  'document' : string,
  'field' : string
}

export abstract class RelationalController extends CRUDController {

  public static classMap : Map<string, RelationalController> = new Map<string, RelationalController>(); //key : collection name (must be index+collection in futur....). Value : controller

  private static isInit = false;

  public static init () {
    if (! this.isInit) {
      this.isInit = true;
      global.app.errors.register('device-manager', 'relational_controller', 'remove_unexisting_link', {
        class: 'BadRequestError',
        description: 'you can\'t remove an unexisting link',
        message: 'you can\'t remove an unexisting link',
      });
      global.app.errors.register('device-manager', 'relational_controller', 'already_linked', {
        class: 'BadRequestError',
        description: 'Creation of multiple relation on a OneToMany relation',
        message: '%s cannot have multiple %s relation',
      });
      global.app.errors.register('device-manager', 'relational_controller', 'link_already_exist', {
        class: 'BadRequestError',
        description: 'the link already exist',
        message: 'the link already exist',
      });
    }
  }

  protected constructor (plugin: Plugin, name : string) {
    super(plugin, name);
    RelationalController.classMap.set(name, this);
    RelationalController.init();
  }

  protected get sdk () {
    return this.context.accessors.sdk;
  }


  /**
   * Default FieldPath builder, to write smaller code
   */
  protected getFieldPath (request : KuzzleRequest, fieldName : string, documentKey : string = '_id', collectionName : string = this.collection, indexKey : string = 'engineId', ): FieldPath {
    return {
      collection: collectionName,
      document: documentKey ? request.getString(documentKey) : null,
      field: fieldName,
      index: indexKey ? request.getString(indexKey) : null,
    };
  }

  async create (request: KuzzleRequest) {
    request.input.args.index = request.getString('engineId');
    return super.create(request);
  }

  /**
   * Update document (like update from CRUDController) but propagate update from objects that contain the edited object
   * @param request : standard update request
   * @param manyToManyLinkedFields : list of field name that contain FieldPath representing a manyToMany relation where the updated object is embedded
   * @param oneToManyLinkedFields : list of field name that contain FieldPath representing a oneToMany relation where the updated object is embedded
   */
  async genericUpdate (request: KuzzleRequest, manyToManyLinkedFields? : string[], oneToManyLinkedFields? : string[]) {
    request.input.args.index = request.getString('engineId');
    const promises : Promise<void>[] = [];
    if (manyToManyLinkedFields || oneToManyLinkedFields) {
      const document = await this.sdk.document.get(request.getString('engineId'), this.collection, request.getId());
      if (manyToManyLinkedFields) {
        for (const linkedField of manyToManyLinkedFields) {
          promises.push(this.propagateUpdate(linkedField, true, document, request));
        }
      }
      if (oneToManyLinkedFields) {
        for (const linkedField of oneToManyLinkedFields) {
          promises.push(this.propagateUpdate(linkedField, false, document, request));
        }
      }
    }
    await Promise.all(promises);
    return super.update(request);
  }

  /**
   * function used to propagate the update the changes to documents that contain an embedded version of the edited document (name documentToUpdate)
   * remove the dead link to document that does not exist anymore.
   * @param linkedField : name of the field used to represent the link between the original updated document and documents that embedded it
   * @param manyToMany : is it a many to many relation (or one to one)
   * @param documentToUpdate : original updated document
   * @param originalRequest : original received request (will be edited to add remove dead link informations.
   */
  async propagateUpdate (linkedField : string, manyToMany : boolean, documentToUpdate : KDocument<any>, originalRequest : KuzzleRequest ) {
    const updateBody = JSON.parse(JSON.stringify(originalRequest.getBody()));
    const updateId = originalRequest.getId();
    const user = originalRequest.getUser();

    const listContainer : FieldPath[] = documentToUpdate._source[linkedField];

    if (! listContainer) {
      return ;
    }
    const promises : Promise<void>[] = [];
    for (const containerFieldPath of listContainer) {
      const containerUpdateBody = {};

      //Lazy deleting
      const containerDocument = await this.getDocumentContent(containerFieldPath, false);
      if (! containerDocument) {
        this.removeLink(originalRequest, linkedField, containerFieldPath, documentToUpdate);
        continue;
      }
      //end of lazy deleting

      if (manyToMany) {
        const arrayToEdit = containerDocument[containerFieldPath.field];
        const indexToEdit = arrayToEdit.findIndex(element => element._kuzzleId === updateId);
        arrayToEdit[indexToEdit] = updateBody;
        arrayToEdit[indexToEdit]._kuzzleId = updateId;
        containerUpdateBody[containerFieldPath.field] = arrayToEdit;
      }
      else {
        containerUpdateBody[containerFieldPath.field] = updateBody;
      }
      promises.push(this.updateRequest(containerFieldPath, containerUpdateBody, user));
    }
    await Promise.all(promises);
  }


  /**
   * Delete document (like update from CRUDController) but propagate deletion from objects that contain the edited object
   * @param request : standard delete request
   * @param manyToManyLinkedFields : list of field name that contain FieldPath representing a manyToMany relation where the removed document is embedded
   * @param oneToManyLinkedFields : list of field name that contain FieldPath representing a oneToMany relation where the removed document is embedded
   * @param nestedFields : contain field name, collection name and index name of documents that can have a reference to the document to delete.
   */
  async genericDelete (request: KuzzleRequest, manyToManyLinkedFields : string[] = [], oneToManyLinkedFields : string[] = [], nestedFields : FieldPath[] = []) {
    request.input.args.index = request.getString('engineId');
    const promises : Promise<void>[] = [];

    promises.push(this.deleteNested(request, nestedFields));

    if (manyToManyLinkedFields.length > 0 || oneToManyLinkedFields.length > 0) {
      const document = await this.sdk.document.get(request.getString('engineId'), this.collection, request.getId());
      for (const childrenField of manyToManyLinkedFields) {
        promises.push(this.propagateDelete(document._source[childrenField], childrenField, true, request));
      }
      for (const containerField of oneToManyLinkedFields) {
        promises.push(this.propagateDelete(document._source[containerField], containerField, false, request));
      }
    }
    await Promise.all(promises);
    return super.delete(request);
  }

  /**
   *
   * @param request : original delete request
   * @param nestedFields : contain field name, collection name and index name of documents that can have a reference to the document to delete.
   */
  async deleteNested (request: KuzzleRequest, nestedFields : FieldPath[] = []) { //nestedField must contain : index/collection and field with id to object to delete of CONTAINER
    request.input.args.index = request.getString('engineId');
    const promises : Promise<void>[] = [];
    for (const nestedField of nestedFields) {
      const query = {
        'match': {
          [nestedField.field]: request.getId()
        }
      };
      const search =
        {
          query
        };
      promises.push(this.sdk.document.search(nestedField.index, nestedField.collection, search).then(
        find => {
          return this.propagateToNested(find, nestedField.index, nestedField.collection, nestedField.field, request.getId(), request.getUser());
        }));
    }
    await Promise.all(promises);
  }

  /**
   * edit nested fields of document that contain link to removed document
   * @param documents : SearchResult of all documents to edit
   * @param index of document to edit
   * @param collection of document to edit
   * @param field that need to be edited
   * @param requestId : id of document removed from the original request
   * @param user : User of original request
   */
  async propagateToNested (documents : SearchResult<KHit<KDocumentContentGeneric>>, index : string, collection : string, field : string, requestId : string, user : User) {
    const promises : Promise<void>[] = [];
    while (documents) {
      for (const document of documents.hits) {
        const request = {};
        if (Array.isArray(document._source[field])) {
          request[field] = document._source[field].filter(id => id !== requestId);
        }
        else {
          request[field] = null;
        }
        promises.push(this.updateRequestRaw(index, collection, document._id, request, user));
      }
      documents = await documents.next();
    }
    await Promise.all(promises);
  }

  /**
   * delete embedded copy of a removed document
    * @param listContainer : list of fieldPath that represent fields where doc
   * @param childrenField : name of field in removed document that contain relation information
   * @param manyToMany : is it manyToMany relation (or one to many?)
   * @param request : original delete request
   */
  async propagateDelete ( listContainer: FieldPath[], childrenField: string, manyToMany : boolean, request : KuzzleRequest) {
    if (! listContainer) {
      return;
    }
    const engineId = request.getString('engineId');
    const removedObjectId = request.getId();
    const promises : Promise<void>[] = [];
    for (const container of listContainer) {
      promises.push( this.genericUnlink(request,
        { collection: this.collection, document: removedObjectId, field: childrenField, index: engineId, },
        container, manyToMany));
    }
    await Promise.all(promises);
  }


  /**
   * link two element
   * @param request : original request
   * @param embedded : field that represent relation in document that will be embedded
   * @param container : field that represent relation in document that will contain the other
   * @param manyToMany : is it manyToMany relation (or one to many?)
   */
  async genericLink (request : KuzzleRequest, embedded : FieldPath, container : FieldPath, manyToMany : boolean) {

    // before alteration, we verify that a document with OneToMany relation is not already linked
    if (! manyToMany) {
      const containerDocument = await this.getDocumentContent(container);
      if (containerDocument[container.field]) {
        throw global.app.errors.get('device-manager', 'relational_controller', 'already_linked', container.collection, container.field);
      }
    }

    //First we update embedded document by adding link to container document
    const document = await this.getDocumentContent(embedded);
    if (! document[embedded.field]) {
      document[embedded.field] = [];
    }
    this.verifyNotAlreadyLinked(document[embedded.field], container);
    document[embedded.field].push(container);
    const updateMessage = {};
    updateMessage[embedded.field] = document[embedded.field];
    await this.updateRequest(embedded, updateMessage, request.getUser());

    //Second we update child document by adding content of parent document
    document[embedded.field] = undefined;
    document._kuzzle_info = undefined;
    const updateMessageDest = {};
    if (manyToMany) {
      const containerDocument = await this.getDocumentContent(container);
      document._kuzzleId = embedded.document;
      updateMessageDest[container.field] = containerDocument[container.field] ? containerDocument[container.field] : [];
      updateMessageDest[container.field].push(document);
    }
    else {
      updateMessageDest[container.field] = document;
    }
    await this.updateRequest(container, updateMessageDest, request.getUser());
  }

  /**
   * throw an error if the link is in the list of link
   * @param listList
   * @param link
   */
  verifyNotAlreadyLinked (listList: FieldPath[], link: FieldPath) {
    for (const fieldPath of listList) {
      if (this.equal(fieldPath, link)) {
        throw global.app.errors.get('device-manager', 'relational_controller', 'link_already_exist');
      }
    }
  }

  /**
   * unlink two element
   * @param request : original request
   * @param embedded : field that represent relation in document that is embedded
   * @param container : field that represent relation in document that contain the other
   * @param manyToMany : is it manyToMany relation (or one to many?)
   */
  async genericUnlink (request : KuzzleRequest, embedded : FieldPath, container : FieldPath, manyToMany :boolean) {
    const document = await this.getDocumentContent(embedded);
    if (! document[embedded.field]) {
      global.app.errors.get('device-manager', 'relational_controller', 'remove_unexisting_link');
    }
    const index = document[embedded.field].findIndex(fieldPath => this.equal(fieldPath, container));
    if (index === -1) {
      global.app.errors.get('device-manager', 'relational_controller', 'remove_unexisting_link');
    }
    document[embedded.field].splice(index, 1);
    const updateMessage = {};
    updateMessage[embedded.field] = document[embedded.field];
    await this.updateRequest(embedded, updateMessage, request.getUser());

    const containerDocument = await this.getDocumentContent(container );
    const updateRequest = {};
    if (manyToMany) {
      updateRequest[container.field] = containerDocument[container.field].filter(embeddedDocument => embeddedDocument._kuzzleId !== embedded.document);
    }
    else {
      updateRequest[container.field] = null;
    }
    await this.updateRequest(container, updateRequest, request.getUser());


  }

  /**
   * return the content (_source) of the document represented in the fieldPath
   * If throwError = false, return null if the document does not exist, if not throw error
   * @param path
   */
  public async getDocumentContent (path : FieldPath, throwError = true) {
    try {
      const document = await this.sdk.document.get(path.index, path.collection, path.document);
      return document._source;
    }
    catch (err) {
      if (err.id === 'services.storage.not_found' && ! throwError) {
        return null;
      }
      throw err;
    }
  }


  /**
   * remove a broken link (linked document was removed)
   * @param request : original request
   * @param linkedField : name of the field used to represent the link between the original updated document and documents that embedded it
   * @param containerFieldPath : FieldPath to a document that contain link to a removed document
   * @param containerDocument : document that contain the broken link
   * @private
   */
  private removeLink (request: KuzzleRequest, linkedField: string, containerFieldPath: FieldPath, containerDocument: KDocument<KDocumentContentGeneric>) {
    if (! request.input.body[linkedField]) {
      request.input.body[linkedField] = containerDocument._source[linkedField];
    }
    request.input.body[linkedField] = request.input.body[linkedField].filter(field => ! this.equal(field, containerFieldPath));
  }

  /**
   * return true if two FieldsPath are equals
   * @param f1
   * @param f2
   */
  public equal (f1 : FieldPath, f2 : FieldPath) {
    return f1.index === f2.index
      && f1.collection === f2.collection
      && f1.document === f2.document
      && f1.field === f2.field;
  }

  /**
   * create a new update request to edit a document (call controller.update if controller to call is know, or use document.update)
   * @param fieldPath : target document
   * @param body : body of the update request
   * @param user : user of original request
   * @private
   */
  private async updateRequest (fieldPath: FieldPath, body: any, user : User) {
    await this.updateRequestRaw(fieldPath.index, fieldPath.collection, fieldPath.document, body, user);
  }

  /**
   * create a new update request to edit a document (call controller.update if controller to call is know, or use document.update)
   * @param index : index of target document
   * @param collection  : collection  of target document
   * @param document   : index of target document
   * @param body : body of the update request
   * @param user : user of original request
   * @private
   */
  private async updateRequestRaw (index: string, collection : string, document : string, body, user : User) {
    if (RelationalController.classMap && RelationalController.classMap.has(collection)) {
      const request = new KuzzleRequest({
        _id: document,
        body,
        engineId: index,
        index,
      }, {});
      request.context.user = user;
      await RelationalController.classMap.get(collection).update(request);

    }
    else {

      await this.sdk.document.update(
        index,
        collection,
        document,
        body,
      );
    }
  }

  /**
   *
   * @param index
   * @param collection
   * @param documentId
    * @param nestedFields : contain field name in the document to get, collection name and index name of documents that are linked
   */
  protected async genericGet<TKDocumentContent extends KDocumentContent> (index: string, collection : string, documentId : string, nestedFields : FieldPath[] = []): Promise<KDocument<TKDocumentContent>> {
    const document = await this.sdk.document.get<TKDocumentContent>(index, collection, documentId);
    return this.esDocumentToFormatted(index, collection, document, nestedFields);
  }

  /**
   *
   * @param index
   * @param collection
   * @param documentId
   * @param nestedFields : contain field name in the document to get, collection name and index name of documents that are linked
   */
  protected async esDocumentToFormatted<TKDocumentContent extends KDocumentContent> (index: string, collection : string, document : KDocument<TKDocumentContent>, nestedFields : FieldPath[] = []): Promise<KDocument<TKDocumentContent>> {
    const promises : Promise<void>[] = [];
    for (const nestedField of nestedFields) {
      promises.push(this.replaceNestedFieldByContent(document, nestedField));
    }
    await Promise.all(promises);
    return document;
  }

  /**
   * Edit the document : replace content of field given by nestedField with content pointed
   * @param document : document to edit
   * @param nestedField : : contain field name in the document to get, collection name and index name of documents that are linked
   */
  private async replaceNestedFieldByContent (document : KDocument<KDocumentContent>, nestedField : FieldPath ) {
    if (document._source[nestedField.field]) {
      document._source[nestedField.field] = await this.getRequestRaw(nestedField.index, nestedField.collection, document._source[nestedField.field]);
    }
  }

  private async getRequestRaw (index: string, collection : string, documentId : string) : Promise<KDocumentContent> {

    const request = new KuzzleRequest({
      _id: documentId,
      collection,
      engineId: index,
      index,

    }, {});
    if (RelationalController.classMap && RelationalController.classMap.has(collection)) {
      return RelationalController.classMap.get(collection).get(request);
    }
    return this.get(request);
  }

  protected async get (request): Promise<KDocumentContent> {
    const document = await this.sdk.document.get(request.getString('index'), request.getString('collection'), request.getId());
    return document._source;
  }


}


