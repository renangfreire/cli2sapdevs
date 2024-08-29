import { generatorProps } from "../@types/generator";

export function generateTemplate({templatePath, generatorType, filePath}: generatorProps){
    const CUR_DIR = process.cwd();
    
    console.log(CUR_DIR)
}