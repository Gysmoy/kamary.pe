import Global from '../../Utils/Global'

const Footer = () => {
  const fullYear = new Date().getFullYear()
  return (<footer className="footer">
    <div className="page-container">
      <div className="row">
        <div className="col-md-6 text-center text-md-start">
          {fullYear} © {Global.APP_NAME}. Todos los derechos reservados.
          <div className="visually-hidden"> By <a href={`//devex.pe/?utm_source=${Global.APP_CORRELATIVE}`}>{Global.APP_BY}</a></div>
        </div>
        <div className="col-md-6">
          <div className="text-md-end footer-links d-none d-md-block">
            {/* <a href="javascript: void(0);">About</a>
            <a href="javascript: void(0);">Support</a>
            <a href="javascript: void(0);">Contact Us</a> */}
          </div>
        </div>
      </div>
    </div>
  </footer>)
}

export default Footer