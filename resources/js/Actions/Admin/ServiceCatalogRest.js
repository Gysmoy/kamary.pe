import BasicRest from "../BasicRest";
import { isStoragePath } from "../../Utils/permissionScope";

class ServiceCatalogRest extends BasicRest {
  path = isStoragePath() ? 'admin/storage/general-service' : 'admin/services'
}

export default ServiceCatalogRest
