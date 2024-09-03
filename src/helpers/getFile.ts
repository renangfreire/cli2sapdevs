import path from "path"
import * as fsPromises from "fs/promises"
import * as fs from "fs"

export async function getFile(searchedFilePath: string, filename: string): Promise<[string, boolean]>{
    const componentPath = path.join(searchedFilePath, filename)

    // verifying existence of the requested file 
    if(fs.existsSync(componentPath)){
        const componentBuffer = await fsPromises.readFile(componentPath, 'utf-8')

        return [componentBuffer, false]
    }

    return ["", true]
}