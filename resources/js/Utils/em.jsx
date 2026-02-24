import HtmlContent from "./HtmlContent"

const em = (string = '') => {
  return <HtmlContent html={
    String(string).replace(
      /\*(.*?)\*/g,
      '<b class="text-primary italic">$1</b>'
    )} />
}

export default em