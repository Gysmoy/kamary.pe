import BasicRest from "../BasicRest"

class SendingHistoryRest extends BasicRest {
  path = 'admin/mailing/history'
  hasFiles = true;
}

export default SendingHistoryRest