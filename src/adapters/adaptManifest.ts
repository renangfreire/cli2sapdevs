import { ExitProcessError } from "../utils/finishProcess"
import { getFile } from "../helpers/getFile"

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

export async function adaptManifest(webAppPath: string): Promise<manifestSchema>{
    const [manifestFile, err] = await getFile(webAppPath, "manifest.json")
    const manifestJson: manifestSchemaEntry = JSON.parse(manifestFile)
    if(err) ExitProcessError("Manifest.json not founded in your project path, try change prompt path")

    const sapApp = manifestJson["sap.app"]

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