---
code: true
type: page
title: RelationalController
description: Kuzzle IoT - RelationalController class
---

# RelationalController

RelationalController is an abstract class that can be extend to create controller for entity that can be linked with other entities.
It present different method to create, update and remove the relations, and to automatically update document that contain a copy of another document.
The relation can be "embedded" or "nested". 

# Nested relation

An embedded relation is a relation that is symbolised by a string that contain the id of the linked document.
There is no invert relation : the linked document do not know which document link it. 
The link will be automatically removed when the object is removed calling genericDelete.

# Embedded relation

An embedded relation is a relation when an object contain a copy of the other object. 
The embedded object contain a link to the container object. 
Link are represented in the embedded document as FieldPath : A fieldPath contain the index, the collection, the id of the document and the field that contain the copy.
Link are necessary to do edition propagation : When we edit an embedded object, each object that contain a copy must have its copy updated. When we remove an embedded object, each copy will be removed to.

# Dead link and lazy deleting
When we remove a container object, we do not have informations about where does the embbedded document come from (index, collection, field) so we cannot remove the fieldPath that represent the link in the embedded document.
That should be ok, because fieldPath are designed for internal use in RelationalController.
But if a custom code should exploit information in FieldPath, it must take dead link into consideration. 
FieldPath will be removed when we try to propagate an edition : if the FieldPath is a dead link (referenced object is deleted), it will be deleted. 



