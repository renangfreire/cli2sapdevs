import * as fs from "fs"
import * as fsPromises from "fs/promises"
import path from "path"
import { ExitProcessError } from "../utils/finishProcess"

interface manifestSchemaEntry {
    [key: string]: any
}

type dataSourceEntry = {
    [key: string]: {
        uri: string;
        type: string;
        settings?: {
            annotations?: string[];
            localUri?: string;
            odataVersion?: string;
        };
    }
}

type dataSourceReturn = {
    serviceName: string,
    uri: string,
    type: string,
    odataVersion?: string
}

export interface manifestSchema {
    projectId: string,
    dataSources: dataSourceReturn[],
}

async function getManifest(webAppPath: string): Promise<[manifestSchemaEntry, boolean]>{
    const manifestPath = path.join(webAppPath, "manifest.json")

    // verifying existence of the requested file 
    if(fs.existsSync(manifestPath)){
        const manifestBuffer = await fsPromises.readFile(manifestPath)
        const manifestFile = JSON.parse(manifestBuffer.toString()) as {[key: string]: any}

        return [manifestFile, false]
    }

    return [{}, true]
}

export async function adaptManifest(webAppPath: string): Promise<manifestSchema>{
    const [manifestFile, err] = await getManifest(webAppPath)
    if(err) ExitProcessError("Manifest.json not founded in your project path, try change prompt path")

    const sapApp = manifestFile["sap.app"]

    const dataSources = adaptDataSources(sapApp["dataSources"])
    
    const adaptedManifestFile: manifestSchema = {
        projectId: sapApp.id,
        dataSources
    }

    return adaptedManifestFile
}

function adaptDataSources(sapApp: dataSourceEntry): dataSourceReturn[]{
    const dataSources: dataSourceReturn[] = []
    
    Object.entries(sapApp).forEach(([connectionName, connectionContent]: [string, any]) => {
        if(!connectionContent?.uri && !connectionContent?.type) return

        const connection = {
            serviceName: connectionName,
            uri: connectionContent.uri as string,
            type: connectionContent.type as string,
            odataVersion: connectionContent?.settings?.odataVersion
        }

        dataSources.push(connection)
    })

    return dataSources
}