import { CRUDController } from 'kuzzle-plugin-commons';
import { KDocument, KDocumentContentGeneric, KHit, KuzzleError, KuzzleRequest, Plugin, SearchResult } from 'kuzzle';
import { User } from 'kuzzle/lib/types';

export interface FieldPath {
  'index' : string,
  'collection' : string,
  'document' : string,
  'field' : string
}

export abstract class RelationalController extends CRUDController {

  public static classMap : Map<string, RelationalController> = new Map<string, RelationalController>(); //key : collection name (must be index+collection in futur....). Value : controller

  protected constructor (plugin: Plugin, name : string) {
    super(plugin, name);
  }

  private get sdk () {
    return this.context.accessors.sdk;
  }
  
  async create (request: KuzzleRequest) {
    request.input.args.index = request.getString('engineId');
    return super.create(request);
  }

  async genericUpdate (request: KuzzleRequest, manyToManyLinkedFields? : string[], oneToManyLinkedFields? : string[]) {
    request.input.args.index = request.getString('engineId');
    const promises : Promise<void>[] = [];
    if (manyToManyLinkedFields || oneToManyLinkedFields) {
      const document = await this.sdk.document.get(request.getString('engineId'), this.collection, request.getId());
      if (manyToManyLinkedFields) {
        for (const linkedField of manyToManyLinkedFields) {
          promises.push(this.propagateUpdate(linkedField, true, document, request.getBody(), request.getId(), request.context.user, request));
        }
      }
      if (oneToManyLinkedFields) {
        for (const linkedField of oneToManyLinkedFields) {
          promises.push(this.propagateUpdate(linkedField, false, document, request.getBody(), request.getId(), request.context.user, request));
        }
      }
    }
    await Promise.all(promises);
    return super.update(request);
  }

  async propagateUpdate (linkedField : string, manyToMany : boolean, documentToUpdate : KDocument<any>, updateBody, updateId : string, user : User, originalRequest : KuzzleRequest ) { //TODO : optimize that !!!!!
    const listContainer : FieldPath[] = documentToUpdate._source[linkedField];
    const promises : Promise<void>[] = [];
    for (const containerFieldPath of listContainer) {
      const containerUpdateBody = {};

      //Lazy deleting
      const containerDocument = await this.getDocumentContent(containerFieldPath);
      if (! containerDocument) {
        this.remove(originalRequest, linkedField, containerFieldPath, documentToUpdate);
        continue;
      }
      //end of lazy deleting

      if (manyToMany) {
        const indexToEdit = containerDocument._source[containerFieldPath.field].findIndex(element => element._kuzzleId === updateId);
        containerDocument._source[containerFieldPath.field][indexToEdit] = updateBody;
        containerDocument._source[containerFieldPath.field][indexToEdit]._kuzzleId = updateId;
        containerUpdateBody[containerFieldPath.field] = containerDocument._source[containerFieldPath.field];
      }
      else {
        containerUpdateBody[containerFieldPath.field] = updateBody;
      }
      promises.push(this.updateRequest(containerFieldPath.index, containerFieldPath.collection, containerFieldPath.document, containerUpdateBody, user));
    }
    await Promise.all(promises);
  }

  async genericDelete (request: KuzzleRequest, manyToManyLinkedFields? : string[], oneToManyLinkedFields? : string[], nestedFields? : FieldPath[]) {
    request.input.args.index = request.getString('engineId');
    const promises : Promise<void>[] = [];

    if (nestedFields) {
      promises.push(this.deleteNested(request, nestedFields));
    }
    if (manyToManyLinkedFields || oneToManyLinkedFields ) {
      const document = await this.sdk.document.get(request.getString('engineId'), this.collection, request.getId());
      if (manyToManyLinkedFields) {
        for (const childrenField of manyToManyLinkedFields) {
          promises.push(this.propagateDelete(document._source[childrenField], childrenField, request.getString('engineId'), request.getId(), true, request));
        }
      }
      if (oneToManyLinkedFields) {
        for (const containerField of oneToManyLinkedFields) {
          promises.push(this.propagateDelete(document._source[containerField], containerField, request.getString('engineId'), request.getId(), false, request)); //TODO : await all
        }
      }
    }
    await Promise.all(promises);
    return super.delete(request);
  }
  
  async deleteNested (request: KuzzleRequest, nestedFields : FieldPath[]) { //nestedField must contain : index/collection and field with id to object to delete of CONTAINER
    request.input.args.index = request.getString('engineId');
    const promises : Promise<void>[] = [];
    if (nestedFields) {
      for (const nestedField of nestedFields) {
        const search = {
          'equals': { }
        };
        search.equals[nestedField.field] = request.getId();
        const realSearch =
          {
            query: search
          };
        promises.push(this.sdk.document.search(nestedField.index, nestedField.collection, realSearch, { lang: 'koncorde' } ).then(
          find => {
            return this.propagateToNested(find, nestedField.index, nestedField.collection, nestedField.field, request.getId(), request.getUser());
          }));
      }
    }
    await Promise.all(promises);
  }
  
  async propagateToNested (documents : SearchResult<KHit<KDocumentContentGeneric>>, index : string, collection : string, field : string, requestId : string, user : User) {
    const promises : Promise<void>[] = [];
    for (const document of documents.hits) {
      const request = {};
      request[field] = document[field].filter( id => id !== requestId);
      promises.push(this.updateRequest(index, collection, document._id, request, user));
    }
    await Promise.all(promises);
  }
  
  async propagateDelete ( listContainer: FieldPath[], childrenField: string, engineId : string, removedObjectId : string, manyToMany : boolean, request : KuzzleRequest) { //TODO : optimize!
    const promises : Promise<void>[] = [];

    for (const container of listContainer) {
      promises.push( this.genericUnlink(request,
        { collection: this.collection, document: removedObjectId, field: childrenField, index: engineId, },
        container, manyToMany)); //TODO : remove await? => await.all
    }
    await Promise.all(promises);

  }


  async genericLink (request : KuzzleRequest, embedded : FieldPath, container : FieldPath, manyToMany : boolean) {

    //First we update embedded document by adding link to container document
    const document = await this.sdk.document.get(embedded.index, embedded.collection, embedded.document); //TODO : verify that document is not already linked
    if (! document._source[embedded.field]) {
      document._source[embedded.field] = [];
    }
    document._source[embedded.field].push(container);
    const updateMessage = {};
    updateMessage[embedded.field] = document._source[embedded.field];
    //await this.sdk.document.update(embedded.index, embedded.collection, embedded.document, updateMessage ); // TODO : await to Promise.all //TODO :         await GenericController.classMap.get(containerFieldPath.collection).update(request); //Chinese black magic!
    await this.updateRequest(embedded.index, embedded.collection, embedded.document, updateMessage, request.getUser());
    //Second we update child document by adding content of parent document
    delete document._source[embedded.field];
    delete document._source._kuzzle_info;
    if (manyToMany) {
      const containerDocument = await this.sdk.document.get(container.index, container.collection, container.document );
      document._source._kuzzleId = document._id;
      const updateMessageDest = {};
      updateMessageDest[container.field] = containerDocument[container.field] ? containerDocument[container.field] : [];
      updateMessageDest[container.field].push(document._source);
      //await this.sdk.document.update(container.index, container.collection, container.document, updateMessageDest );
      await this.updateRequest(container.index, container.collection, container.document, updateMessageDest, request.getUser());
    }
    else {
      const updateMessageDest = {};
      updateMessageDest[container.field] = document._source;
      //await this.sdk.document.update(container.index, container.collection, container.document, updateMessageDest );
      await this.updateRequest(container.index, container.collection, container.document, updateMessageDest, request.getUser());

    }
  }

  async genericUnlink (request : KuzzleRequest, embedded : FieldPath, container : FieldPath, manyToMany :boolean) {
    const document = await this.sdk.document.get(embedded.index, embedded.collection, embedded.document);
    if (! document._source[embedded.field]) {
      throw new KuzzleError('you cannot unlink object that is not linked', 404);
    }

    const index = document._source[embedded.field].findIndex(fieldPath => this.equal(fieldPath, container));

    if (index === -1) {
      throw new KuzzleError('you cannot unlink object that is not linked', 404);
    }
    document._source[embedded.field].splice(index, 1);

    const updateMessage = {};
    updateMessage[embedded.field] = document._source[embedded.field];
    //await this.sdk.document.update(embedded.index, embedded.collection, embedded.document, updateMessage ); //TODO : remove await => Promise.all
    await this.updateRequest(embedded.index, embedded.collection, embedded.document, updateMessage, request.getUser());

    //Second we update container document by removing content of embedded document TODO : list and not a single object so remove element to old list
    const containerDocument = await this.sdk.document.get(container.index, container.collection, container.document );
    const updateRequest = {};
    if (manyToMany) {
      updateRequest[container.field] = containerDocument._source[container.field].filter(embeddedDocument => embeddedDocument._kuzzleId === document._id);
    }
    else {
      updateRequest[container.field] = null;
    }
    //await this.sdk.document.update(container.index, container.collection, container.document, updateRequest );
    await this.updateRequest(container.index, container.collection, container.document, updateRequest, request.getUser());

  }

  public async getDocumentContent (path : FieldPath) {
    try {
      return await this.sdk.document.get(path.index, path.collection, path.document);
    }
    catch (err) {
      if (err.id === 'services.storage.not_found') {
        return null;
      } 
      throw err;
    }
  }

  //change the update request to add the order to remove the link
  private remove (request: KuzzleRequest, linkedField: string, containerFieldPath: FieldPath, containerDocument: KDocument<KDocumentContentGeneric>) {
    if (! request.input.body[linkedField]) {
      request.input.body[linkedField] = containerDocument._source[linkedField];
    }
    request.input.body[linkedField] = request.input.body[linkedField].filter(field => ! this.equal(field, containerFieldPath));
  }

  public equal (f1 : FieldPath, f2 : FieldPath) {
    return f1.index === f2.index
      && f1.collection === f2.collection
      && f1.document === f2.document
      && f1.field === f2.field;
  }
  
  
  private async updateRequest (index: string, collection : string, document : string, body, user : User) {
    if (RelationalController.classMap && RelationalController.classMap.has(collection)) {
      const request = new KuzzleRequest({
        _id: document,
        body: body,
        engineId: index,
        index: index,


      }, {});
      request.context.user = user;
      await RelationalController.classMap.get(collection).update(request); //Chinese black magic!
    }
    else {
      await this.as(user).document.update( //TODO : remove await? => await.all : TODO : lazy remove TODO : use this.update for propagate change to chain embedding!!!!
        index,
        collection,
        document,
        body,
      );
    }
  }
  
}


