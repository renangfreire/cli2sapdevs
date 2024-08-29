import * as fsPromises from "fs/promises"
import * as fs from "fs"

import path from "path";
import { generatorProps } from "../@types/generator";

async function fetchWebappFolder(){
    const CUR_DIR = process.cwd();

    if(CUR_DIR.includes('webapp')){
        return CUR_DIR
    }

    const files = await fsPromises.readdir(CUR_DIR);
    const webappFolder = files.find((file) => file === 'webapp');
    if (!webappFolder) {
        console.log('It must be running inside a UI5 app that contains a webapp');
        process.exit();
    }
    
    return path.join(CUR_DIR, webappFolder)
}

async function createFolder (generatorType: string, webAppPath: string){
    const fileFolder = path.join(webAppPath, generatorType)

    if(!fs.existsSync(fileFolder)){
        fsPromises.mkdir(fileFolder)
    }

    return fileFolder
}

async function createFile(templatePath: string, createdFileFolder: string){
    const filesToCreate = await fsPromises.readdir(templatePath)
    
    filesToCreate.forEach(async (file) => {
        const orgFile = path.join(templatePath, file)

        const stats = await fsPromises.stat(orgFile)

        if(stats.isFile()){
            if(fs.existsSync(file)) return console.log("file already exists!")

            const template = await fsPromises.readFile(orgFile, 'utf-8')
            fsPromises.writeFile(path.join(createdFileFolder, file), template)
        }
    })
}

export async function generateMicroComponent({templatePath, generatorType, filePath}: generatorProps) {
    const webAppPath = await fetchWebappFolder()

    const createdFileFolder = await createFolder(generatorType, webAppPath)

    createFile(templatePath, createdFileFolder)
}