type PromptResponse = string;
export async function adaptQuestion(promiseResponse: Promise<PromptResponse>) {
    try{
        const response = await promiseResponse;
        return {
            "status": "done",
            "data": response
        }
    }
    catch(error){
        if(error.name == "ExitPromptError"){
            return {
                "status": "exit",
                "data": ""
            }
        }

        return {
            status: "error",
            error: error.message
        }
    }
}