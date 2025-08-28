import path from 'path';
import { transformDocuments, clearProperties } from './utils.js';
import { renameSync } from 'fs';

const pathToTenantIndex = process.env.TENANT_INDEX;
const includeSoftTenants = process.env.WITH_SOFT_TENANTS;

const linkedDevices = {};
let error = false;

console.log('MIGRATING ' + pathToTenantIndex);

// ASSETS
transformDocuments(
  'assets',
  pathToTenantIndex,
  (line) => {
    const propertiesToDelete = ['measures', 'linkedDevices', 'lastMeasuredAt'];
    if(!includeSoftTenants){
      propertiesToDelete.push("softTenant")
    }
    const obj = JSON.parse(line);
    // Check line is a document
    if (obj.body) {
      if (obj.body.groups && obj.body.groups.length) {
        obj.body.groups = obj.body.groups.map((gr) => {
          if (gr._id) {
            return { date: gr.date, path: gr.id };
          }
          return gr;
        });
      }
      obj.body.linkedMeasures = []
      if (obj.body.linkedDevices && obj.body.linkedDevices.length) {
        // Fill the obj of linked devices for later device collection migration
        obj.body.linkedMeasures = obj.body.linkedDevices.map((d) => {
          const measureSlots = d.measureNames.map((m) => ({ asset: m.asset, device: m.device }));
          const deviceLink = { assetId: obj._id, measureSlots };
          if (Array.isArray(linkedDevices[d._id])) {
            linkedDevices[d._id].push(deviceLink);
          } else {
            linkedDevices[d._id] = [deviceLink];
          }
          return { deviceId: d._id, measureSlots };
        });
      }
      obj.body = clearProperties(obj.body, propertiesToDelete);
    }
    return obj;
  },
  undefined,
  () => {
    // DEVICES LAUNCHED ONLY AFTER THE ASSET FILE IS DONE TO HAVE ALL THE LINKED DEVICES
    transformDocuments('devices', pathToTenantIndex, (line) => {
      const propertiesToDelete = ['assetId', 'measures', 'linkedDevices', 'lastMeasuredAt'];
      const obj = JSON.parse(line);
      // Check line is a document

      if (obj.body) {
        if (obj.body.groups && obj.body.groups.length) {
          obj.body.groups = obj.body.groups.map((gr) => {
            if (gr._id) {
              return { date: gr.date, path: gr.id };
            }
            return gr;
          });
        }
        if (linkedDevices[obj._id]) {
          // Fill the obj of linked devices for later device collection migration
          obj.body.linkedMeasures = linkedDevices[obj._id];
        }
        obj.body = clearProperties(obj.body, propertiesToDelete);
      }
      return obj;
    });
  },
);

// GROUPS
renameSync(path.join(pathToTenantIndex, 'assets-groups'), path.join(pathToTenantIndex, 'groups'));
transformDocuments('groups', pathToTenantIndex, (line) => {
  const propertiesToDelete = ['parent', 'children'];
  const obj = JSON.parse(line);
  // Check line is a document

  if (obj.body) {
    if (obj.body.parent) {
      obj.body.path = obj.body.parent + '.' + obj._id;
    } else {
      obj.body.path = obj._id;
    }
    if (linkedDevices[obj._id]) {
      // Fill the obj of linked devices for later device collection migration
      obj.body.linkedMeasures = linkedDevices[obj._id];
    }
    obj.body = clearProperties(obj.body, propertiesToDelete);
  }else{
    if(obj.collection === 'assets-groups'){
      obj.collection = 'groups'
    }
  }
  return obj;
},undefined);

