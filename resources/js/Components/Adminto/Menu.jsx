import 'tippy.js/dist/tippy.css'
import Logout from '../../Actions/Logout'
import MenuItem from './Menu/MenuItem'
import MenuItemContainer from './Menu/MenuItemContainer'
import LaravelSession from '../../Utils/LaravelSession'

const Menu = ({ }) => {
  const mainRole = LaravelSession.roles?.[0] ?? { name: 'User' }

  return <div className="sidenav-menu">


    <a href="/" className="logo">
      <span className="logo-light">
        <span className="logo-lg"><img src="/assets/img/logo.svg" alt="logo" /></span>
        <span className="logo-sm"><img src="/assets/img/icon.svg" alt="small logo" /></span>
      </span>

      <span className="logo-dark">
        <span className="logo-lg"><img src="/assets/img/logo.svg" alt="dark logo" /></span>
        <span className="logo-sm"><img src="/assets/img/icon.svg" alt="small logo" /></span>
      </span>
    </a>


    <button className="button-sm-hover">
      <i className="ri-circle-line align-middle"></i>
    </button>


    <button className="sidenav-toggle-button">
      <i className="ri-menu-5-line fs-20"></i>
    </button>


    <button className="button-close-fullsidebar">
      <i className="ti ti-x align-middle"></i>
    </button>
    <div data-simplebar>
      <div className="sidenav-user">
        <div className="dropdown-center text-center">
          <a className="topbar-link dropdown-toggle text-reset drop-arrow-none px-2" data-bs-toggle="dropdown"
            type="button" aria-haspopup="false" aria-expanded="false">
            <img src={`/api/admin/profile/${LaravelSession.uuid}`}
              className="rounded-circle aspect-square border"
              style={{
                width: '46px',
                aspectRatio: 1,
                objectFit: 'cover',
                objectPosition: 'center',
              }}
              onError={e => e.target.src = `https://ui-avatars.com/api/?name=${LaravelSession.fullname}&color=448BCD&background=FFFFFF11`}
              alt={LaravelSession.fullname} />
            <span className="d-flex justify-content-center gap-1 sidenav-user-name my-2">
              <span>
                <span className="mb-0 fw-semibold lh-base fs-15">{LaravelSession.name?.split(' ')[0]} {LaravelSession.lastname?.split(' ')[0]}</span>
                <p className="my-0 fs-13 text-muted">{mainRole?.name}</p>
              </span>

              <i className="ri-arrow-down-s-line d-block sidenav-user-arrow align-middle"></i>
            </span>
          </a>
          <div className="dropdown-menu dropdown-menu-end">

            <div className="dropdown-header noti-title">
              <h6 className="text-overflow m-0">Bienvenido!</h6>
            </div>


            <a href="/admin/profile" className="dropdown-item">
              <i className="ri-account-circle-line me-1 fs-16 align-middle"></i>
              <span className="align-middle">Mi Perfil</span>
            </a>


            {/* <div href="javascript:void(0);" className="dropdown-item">
              <i className="ri-wallet-3-line me-1 fs-16 align-middle"></i>
              <span className="align-middle">Billetera: <span className="fw-semibold">$89.25k</span></span>
            </div> */}


            <a href="/admin/account" className="dropdown-item">
              <i className="ri-settings-2-line me-1 fs-16 align-middle"></i>
              <span className="align-middle">Mi cuenta</span>
            </a>


            {/* <a href="javascript:void(0);" className="dropdown-item">
              <i className="ri-question-line me-1 fs-16 align-middle"></i>
              <span className="align-middle">Soporte</span>
            </a> */}

            <div className="dropdown-divider"></div>


            {/* <a href="javascript:void(0);" className="dropdown-item">
              <i className="ri-lock-line me-1 fs-16 align-middle"></i>
              <span className="align-middle">Bloquear pantalla</span>
            </a> */}


            <button className="dropdown-item active fw-semibold text-danger" onClick={() => Logout()}>
              <i className="ri-logout-box-line me-1 fs-16 align-middle"></i>
              <span className="align-middle">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>
      <ul className="side-nav">
        <MenuItem href="/admin/home" icon="ti ti-home">Inicio</MenuItem>

        <MenuItemContainer title='Almacén' icon='ti ti-building-warehouse'>
          <MenuItem href="/admin/articles" icon="ti ti-box">Artículos</MenuItem>
          <MenuItem href="/admin/inventory" icon="ti ti-stack-2">Inventario</MenuItem>
          <MenuItem href="/admin/kardex" icon="ti ti-file-text">Kardex</MenuItem>
          <MenuItem href="/admin/laboratories" icon="ti ti-flask">Laboratorios</MenuItem>
          <MenuItem href="/admin/batches" icon="ti ti-tags">Lotes</MenuItem>
          <MenuItem href="/admin/entry-note" icon="ti ti-file-plus">Nota de Entrada</MenuItem>
          <MenuItem href="/admin/exit-note" icon="ti ti-file-minus">Nota de Salida</MenuItem>
          <MenuItem href="/admin/suppliers" icon="ti ti-truck">Proveedores</MenuItem>
          <MenuItem href="/admin/units-of-measure" icon="ti ti-scale">Und. de medida</MenuItem>
        </MenuItemContainer>

        <MenuItemContainer title='Administración' icon='ti ti-credit-card'>
          <MenuItem href="/admin/accounts-payable" icon="ti ti-credit-card">Cuentas por pagar</MenuItem>
          <MenuItem href="/admin/expenses" icon="ti ti-receipt">Gasto</MenuItem>
          <MenuItem href="/admin/daily-summary" icon="ti ti-calendar-stats">Resumen diario</MenuItem>
        </MenuItemContainer>

        <MenuItemContainer title='Comercial' icon='ti ti-briefcase'>
          <MenuItem href="/admin/clients" icon="ti ti-users">Clientes</MenuItem>
          <MenuItem href="/admin/eventual-clients" icon="ti ti-user-star">Clientes Eventual</MenuItem>
          <MenuItem href="/admin/accounts-receivable" icon="ti ti-credit-card-off">Cuenta por Cobrar</MenuItem>
          <MenuItem href="/admin/orders" icon="ti ti-shopping-cart">Pedido</MenuItem>
          <MenuItem href="/admin/pricing" icon="ti ti-tag">Tarifario</MenuItem>
        </MenuItemContainer>

        <MenuItemContainer title='Serv. Almacen...' icon='ti ti-building-warehouse'>
          <MenuItem href="/admin/storage-inventory" icon="ti ti-stack-2">Inventario</MenuItem>
          <MenuItem href="/admin/storage-clients" icon="ti ti-users">Clientes</MenuItem>
          <MenuItem href="/admin/service-orders" icon="ti ti-file-dollar">O. Servicio</MenuItem>
          <MenuItem href="/admin/storage-units" icon="ti ti-scale">Und. de medida</MenuItem>
          <MenuItem href="/admin/storage-products" icon="ti ti-box">Creación del produ...</MenuItem>
          <MenuItem href="/admin/storage-entry-note" icon="ti ti-file-plus">Nota de entrada</MenuItem>
          <MenuItem href="/admin/storage-exit-note" icon="ti ti-file-minus">Nota de salida</MenuItem>
          <MenuItem href="/admin/storage-kardex" icon="ti ti-file-text">Kardex</MenuItem>
          <MenuItem href="/admin/storage-general-service" icon="ti ti-briefcase">Servicio General</MenuItem>
          <MenuItem href="/admin/storage-billing-control" icon="ti ti-receipt-2">Control de Factura...</MenuItem>
          <MenuItem href="/admin/storage-general-service-orders" icon="ti ti-file-invoice">O. Servicio General</MenuItem>
        </MenuItemContainer>

        <MenuItemContainer title='Despacho' icon='ti ti-truck'>
          <MenuItem href="/admin/activity" icon="ti ti-activity">Actividad</MenuItem>
          <MenuItem href="/admin/driver" icon="ti ti-user-circle">Conductor</MenuItem>
          <MenuItem href="/admin/dispatch" icon="ti ti-truck-delivery">Despacho</MenuItem>
          <MenuItem href="/admin/vehicle-zone" icon="ti ti-map-2">Vehículo / Zona</MenuItem>
        </MenuItemContainer>

        <MenuItemContainer title='Servicios' icon='ti ti-briefcase'>
          <MenuItem href="/admin/services-client" icon="ti ti-user">Cliente</MenuItem>
          <MenuItem href="/admin/services-billing" icon="ti ti-file-invoice">Facturación</MenuItem>
          <MenuItem href="/admin/services-service-order" icon="ti ti-file-dollar">Orden de servicio</MenuItem>
          <MenuItem href="/admin/services-services" icon="ti ti-settings">Servicios</MenuItem>
        </MenuItemContainer>

        <MenuItemContainer title='Muestras' icon='ti ti-flask'>
          <MenuItem href="/admin/sample-orders" icon="ti ti-file-text">Pedido</MenuItem>
        </MenuItemContainer>

        <MenuItemContainer title='Magistrales' icon='ti ti-pills'>
          <MenuItem href="/admin/magistrales-articles" icon="ti ti-box">Artículos</MenuItem>
          <MenuItem href="/admin/magistrales-category" icon="ti ti-category">Categoría</MenuItem>
          <MenuItem href="/admin/magistrales-formats" icon="ti ti-file-description">Formatos</MenuItem>
          <MenuItem href="/admin/magistrales-formulas" icon="ti ti-file-analytics">Fórmulas</MenuItem>
          <MenuItem href="/admin/magistrales-incomes" icon="ti ti-file-plus">Ingresos</MenuItem>
          <MenuItem href="/admin/magistrales-inventory" icon="ti ti-stack-2">Inventario</MenuItem>
          <MenuItem href="/admin/magistrales-kardex" icon="ti ti-file-text">Kardex</MenuItem>
          <MenuItem href="/admin/magistrales-laboratory" icon="ti ti-flask">Laboratorio</MenuItem>
          <MenuItem href="/admin/magistrales-purchase-order" icon="ti ti-shopping-cart">O. Compra</MenuItem>
          <MenuItem href="/admin/magistrales-production-order" icon="ti ti-file-dollar">O. Producción</MenuItem>
          <MenuItem href="/admin/magistrales-supplier" icon="ti ti-truck">Proveedor</MenuItem>
          <MenuItem href="/admin/magistrales-responsible" icon="ti ti-user-check">Responsable</MenuItem>
          <MenuItem href="/admin/magistrales-outputs" icon="ti ti-file-minus">Salidas</MenuItem>
          <MenuItem href="/admin/magistrales-unit" icon="ti ti-scale">Unidad</MenuItem>
          <MenuItem href="/admin/magistrales-sales" icon="ti ti-currency-dollar">Ventas</MenuItem>
        </MenuItemContainer>

        <li className="side-nav-title mt-2">Configuraciones</li>
        <MenuItemContainer title="Gestión" icon="ti ti-users">
          <MenuItem href="/admin/users" icon="ti ti-users">Usuarios</MenuItem>
          <MenuItem href="/admin/roles" icon="ti ti-user-check">Roles</MenuItem>
        </MenuItemContainer>
        <MenuItem href="/admin/profile" icon="ti ti-user">Mi perfil</MenuItem>
        <MenuItem href="/admin/account" icon="ti ti-settings">Mi cuenta</MenuItem>
        <MenuItem href="/logout" icon="ti ti-logout">Cerrar sesión</MenuItem>
      </ul>
      <div className="clearfix"></div>
    </div>
  </div>
}

export default Menu