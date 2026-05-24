import { toast } from "sonner";
import BasicRest from "./BasicRest";
import xsrfToken from "../Utils/xsrfToken";

class ProfileRest extends BasicRest {
    path = 'admin/profile'

    profile = async (request) => {
        try {
            const res = await fetch(`/api/${this.path}`, {
                method: 'POST',
                headers: {
                    'X-Xsrf-Token': xsrfToken()
                },
                body: request
            })
            const status = res.ok
            const result = JSON.parseable(await res.text())

            if (!status) throw new Error(result?.message || 'Ocurrio un error inesperado')

            toast.success("Correcto", { description: result.message });
            return result
        } catch (error) {
            toast.error("Error", { description: error.message });
            return null
        }

    }
}

export default ProfileRest
