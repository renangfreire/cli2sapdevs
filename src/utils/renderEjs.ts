import { render } from "ejs"

export function renderEjs(templatePath: string, ejsParams: object){
    return render(templatePath, ejsParams)
}