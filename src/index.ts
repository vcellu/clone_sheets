import config from "../config.json"
import * as fs from 'fs';
import * as path from 'path';
import enigma from 'enigma.js';
import WebSocket from 'ws';


const connectionConfig: EnigmaJS.Configuration = {
    schema: require('enigma.js/schemas/12.170.2.json'),
    url: `wss://${config.tenant}/app/${config.app.id}`,
    // @ts-expect-error
    createSocket: (url: string) => new WebSocket(url, {
        headers: {
            "Authorization": `Bearer ${config.api_key}`
        }
    })
}

const globalSession = enigma.create(connectionConfig);

async function getApp() {
    const global = await globalSession.open();
    //@ts-expect-error
    const app = await global.openDoc(`${config.app.id}`);
    return app
}

async function getSheet(app: unknown, id: string) {
   
    // @ts-expect-error
    const sheet = await app.getObject(`${id}`);
    const props = await sheet.getFullPropertyTree();
    props.qProperty.qInfo.qId = '';
    props.qProperty.qMetaDef.title = `Copy of ${props.qProperty.qMetaDef.title}`;

    return props;
}

async function getMasterObjects(app: unknown) {
    const masterObjectsDefs: { [key: string]: any } = {};
    // @ts-expect-error
    const masterObjectList = await app.createSessionObject({
        qInfo: { qType: 'MasterObjectList' },
        qAppObjectListDef: {
            qType: 'masterobject',
            qData: {
                name: '/qMetaDef/title',
                visualization: '/visualization'
            }
        }
    });
    const masterObjects = await masterObjectList.getLayout();
    const items = masterObjects.qAppObjectList.qItems;
    //@ts-expect-error
    const objects = items.map(item => app.getObject(item.qInfo.qId));
    const mastObjectInstances = await Promise.all(objects);
    const masterObjectPropsPromises = mastObjectInstances.map(mi => mi.getFullPropertyTree());
    const masterObjectProps = await Promise.all(masterObjectPropsPromises);
    return masterObjectProps;  

}

function save(objects: unknown, path: string) {
    fs.writeFileSync(path, JSON.stringify(objects, null, 2));
}

async function cloneSheet() {
    try {
        const app = await getApp();
        const sheetPromises = config.app.sheets.map(id => getSheet(app, id));
        const masterObjects = await getMasterObjects(app);
        const sheets = await Promise.all(sheetPromises);

        // const props = await getSheet(app);
        // const masterObjects = await getMasterObjects(app);
        save(sheets, "sheets.json")
        save(masterObjects, "masterObjects.json")
        globalSession.close();
        console.log("Done!")
    } catch (error: unknown) {
        console.log("Error cloning sheet", error)
    }
}

cloneSheet()