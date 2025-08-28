import {transformDocuments,clearProperties} from './utils.js'

const pathToPlatformIndex = process.env.PLATFORM_INDEX;
console.log("MIGRATING " + pathToPlatformIndex)
// DEVICES

transformDocuments('devices', pathToPlatformIndex, (line)=> {
 
  const propertiesToDelete = ['assetId', 'metadata','measures', 'groups', 'lastMeasuredAt'];
    const obj = JSON.parse(line);
    // Check line is a document
    if (obj.body) {
      obj.body = clearProperties(obj.body, propertiesToDelete);
      const createdAt = obj.body._kuzzle_info?.createdAt
     if(createdAt){
      obj.body.provisionedAt = createdAt
     }
    }
    return obj
  
})

// MODELS
transformDocuments('models', pathToPlatformIndex, (line)=> {
    const obj = JSON.parse(line);
    // Check line is a document
    if (obj.body && obj.body.group) {
     obj.body.group.affinity = {
      type: ['assets', 'devices'],
      models:{
        assets:[],
        devices:[]
      },
      strict:false
     }
    }
    return obj
  
})