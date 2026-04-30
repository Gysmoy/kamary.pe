import 'tippy.js/dist/tippy.css'
import Logout from '../../Actions/Logout'
import MenuItem from './Menu/MenuItem'
import MenuItemContainer from './Menu/MenuItemContainer'
import LaravelSession from '../../Utils/LaravelSession'

const Menu = ({ can, hasRole, panel = null }) => {
  const mainRole = LaravelSession.roles?.[0] ?? { name: 'User' }

  const canAccess = (permission) => {
    return can(permission) || hasRole('Admin')
  }

  return <div className={`sidenav-menu`}>

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
              <i className="ti ti-logout me-1 fs-16 align-middle"></i>
              <span className="align-middle">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>
      <ul className="side-nav">
        <MenuItem href="/admin/home" icon="ti ti-layout-dashboard">Dashboard</MenuItem>

        {canAccess('expenses') && <MenuItem href="/admin/expenses" icon="ti ti-receipt">Gastos</MenuItem>}

        <li className="side-nav-title mt-2">En implementación</li>
        <MenuItemContainer title='Proveedores y Compras' icon='ti ti-shopping-cart'>
          {canAccess('suppliers') && <MenuItem href="/admin/suppliers" icon="ti ti-truck-delivery">Proveedores</MenuItem>}
          {canAccess('purchase-orders') && <MenuItem href="/admin/purchase-orders" icon="ti ti-shopping-cart">Órdenes de compra</MenuItem>}
          {canAccess('purchase-receipts') && <MenuItem href="/admin/purchase-receipts" icon="ti ti-file-import">Recepciones de compra</MenuItem>}
          {canAccess('accounts-payable') && <MenuItem href="/admin/accounts-payable" icon="ti ti-credit-card">Cuentas por pagar</MenuItem>}
        </MenuItemContainer>
        <MenuItemContainer title='Clientes y Comercial' icon='ti ti-briefcase'>
          {canAccess('clients') && <MenuItem href="/admin/clients" icon="ti ti-users">Clientes</MenuItem>}
          {canAccess('eventual-clients') && <MenuItem href="/admin/eventual-clients" icon="ti ti-user-star">Clientes eventuales</MenuItem>}
          {canAccess('client-distribution') && <MenuItem href="/admin/client-distribution" icon="ti ti-map-pin-share">Red distribución</MenuItem>}
          {canAccess('pricing') && <MenuItem href="/admin/pricing" icon="ti ti-tags">Tarifario</MenuItem>}
          {canAccess('orders') && <MenuItem href="/admin/commercial-orders" icon="ti ti-basket">Pedidos</MenuItem>}
          {canAccess('accounts-receivable') && <MenuItem href="/admin/accounts-receivable" icon="ti ti-cash-banknote">Cuentas por cobrar</MenuItem>}
        </MenuItemContainer>
        <MenuItemContainer title='Facturación' icon='ti ti-file-invoice'>
          {(canAccess('businesses') || canAccess('services-billing')) && <MenuItem href="/admin/billing-settings" icon="ti ti-settings-cog">Configuración facturación</MenuItem>}
          {canAccess('services-billing') && <MenuItem href="/admin/billing-documents" icon="ti ti-receipt-2">Comprobantes</MenuItem>}
        </MenuItemContainer>
        <MenuItemContainer title='Servicios y Operaciones' icon='ti ti-truck-delivery'>
          {canAccess('services-service-order') && <MenuItem href="/admin/services-service-order" icon="ti ti-file-dollar">Órdenes de servicio</MenuItem>}
          {canAccess('services-services') && <MenuItem href="/admin/services-services" icon="ti ti-settings">Servicios</MenuItem>}
          {canAccess('dispatch') && <MenuItem href="/admin/dispatch" icon="ti ti-truck-delivery">Despacho</MenuItem>}
          {canAccess('driver') && <MenuItem href="/admin/driver" icon="ti ti-user-circle">Conductores</MenuItem>}
          {canAccess('vehicle-zone') && <MenuItem href="/admin/vehicle-zone" icon="ti ti-map-2">Vehículos / Zonas</MenuItem>}
          {canAccess('activity') && <MenuItem href="/admin/activity" icon="ti ti-activity">Actividades</MenuItem>}
        </MenuItemContainer>
        <MenuItemContainer title='Reportes' icon='ti ti-report-analytics'>
          {canAccess('orders') && <MenuItem href="/admin/reports/sales" icon="ti ti-chart-line">Ventas</MenuItem>}
          {canAccess('inventory') && <MenuItem href="/admin/reports/inventory" icon="ti ti-clipboard-data">Inventario</MenuItem>}
          {canAccess('daily-summary') && <MenuItem href="/admin/daily-summary" icon="ti ti-calendar-stats">Resumen diario</MenuItem>}
        </MenuItemContainer>
        <MenuItemContainer title='Productos' icon='ti ti-package'>
          {canAccess('articles') && <MenuItem href="/admin/articles" icon="ti ti-box" badge='✓'>Artículos</MenuItem>}
          {canAccess('batches') && <MenuItem href="/admin/batches" icon="ti ti-box-multiple" badge='✓'>Lotes</MenuItem>}
          {canAccess('laboratories') && <MenuItem href="/admin/laboratories" icon="ti ti-flask" badge='✓'>Laboratorios</MenuItem>}
          {canAccess('units-of-measure') && <MenuItem href="/admin/units" icon="ti ti-ruler-measure" badge='✓'>Und. medida</MenuItem>}
        </MenuItemContainer>
        <MenuItemContainer title='Almacén' icon='ti ti-building-warehouse'>
          {canAccess('inventory') && <MenuItem href="/admin/inventory" icon="ti ti-stack-2" badge='✓'>Inventario</MenuItem>}
          {canAccess('kardex') && <MenuItem href="/admin/kardex" icon="ti ti-notebook" badge='✓'>Kardex</MenuItem>}
          {canAccess('entry-note') && <MenuItem href="/admin/entry-note" icon="ti ti-file-import" badge='✓'>Notas de Entrada</MenuItem>}
          {canAccess('exit-note') && <MenuItem href="/admin/exit-note" icon="ti ti-file-export" badge='✓'>Notas de Salida</MenuItem>}
          {canAccess('exit-note') && <MenuItem href="/admin/warehouses" icon="ti ti-building-warehouse" badge='✓' badgeColor='danger'>Almacenes</MenuItem>}
        </MenuItemContainer>

        <li className="side-nav-title mt-2">Magistrales</li>

        <MenuItemContainer title='Productos' icon='ti ti-package'>
          {canAccess('articles') && <MenuItem href="/admin/magistrales/articles" icon="ti ti-box">Artículos</MenuItem>}
          {canAccess('batches') && <MenuItem href="/admin/magistrales/batches" icon="ti ti-box-multiple">Lotes</MenuItem>}
          {canAccess('laboratories') && <MenuItem href="/admin/magistrales/laboratories" icon="ti ti-flask">Laboratorios</MenuItem>}
          {canAccess('units-of-measure') && <MenuItem href="/admin/magistrales/units" icon="ti ti-ruler-measure">Und. de medida</MenuItem>}
          {canAccess('suppliers') && <MenuItem href="/admin/magistrales/suppliers" icon="ti ti-truck-delivery">Proveedores</MenuItem>}
        </MenuItemContainer>
        <MenuItemContainer title='Almacén' icon='ti ti-building-warehouse'>
          {canAccess('inventory') && <MenuItem href="/admin/magistrales/inventory" icon="ti ti-stack-2">Inventario</MenuItem>}
          {canAccess('kardex') && <MenuItem href="/admin/magistrales/kardex" icon="ti ti-notebook">Kardex</MenuItem>}
          {canAccess('entry-note') && <MenuItem href="/admin/magistrales/entry-note" icon="ti ti-file-import">Notas de Entrada</MenuItem>}
          {canAccess('exit-note') && <MenuItem href="/admin/magistrales/exit-note" icon="ti ti-file-export">Notas de Salida</MenuItem>}
          {canAccess('exit-note') && <MenuItem href="/admin/magistrales/warehouses" icon="ti ti-building-warehouse">Almacenes</MenuItem>}
        </MenuItemContainer>

        <li className="side-nav-title mt-2">Despacho</li>
        {canAccess('activity') && <MenuItem href="/admin/activity" icon="ti ti-activity">Actividad</MenuItem>}
        {canAccess('driver') && <MenuItem href="/admin/driver" icon="ti ti-user-circle">Conductor</MenuItem>}
        {canAccess('dispatch') && <MenuItem href="/admin/dispatch" icon="ti ti-truck-delivery">Despacho</MenuItem>}
        {canAccess('vehicle-zone') && <MenuItem href="/admin/vehicle-zone" icon="ti ti-map-2">Vehículo / Zona</MenuItem>}
        <li className="side-nav-title mt-2">Serv. Almacenamiento</li>

        {canAccess('service-orders') && <MenuItem href="/admin/service-orders" icon="ti ti-file-dollar">O. Servicio</MenuItem>}
        {canAccess('storage-general-service') && <MenuItem href="/admin/storage-general-service" icon="ti ti-briefcase">Servicio General</MenuItem>}
        {canAccess('storage-billing-control') && <MenuItem href="/admin/storage-billing-control" icon="ti ti-receipt-2">Control de Facturación</MenuItem>}
        {canAccess('storage-general-service-orders') && <MenuItem href="/admin/storage-general-service-orders" icon="ti ti-file-invoice">O. Servicio General</MenuItem>}

        {/* <MenuItemContainer title='Almacén' icon='ti ti-building-warehouse'>
          {canAccess('articles') && <MenuItem href="/admin/articles" icon="ti ti-box">Artículos</MenuItem>}
          {canAccess('inventory') && <MenuItem href="/admin/inventory" icon="ti ti-stack-2">Inventario</MenuItem>}
          {canAccess('kardex') && <MenuItem href="/admin/kardex" icon="ti ti-file-text">Kardex</MenuItem>}
          {canAccess('laboratories') && <MenuItem href="/admin/laboratories" icon="ti ti-flask">Laboratorios</MenuItem>}
          {canAccess('batches') && <MenuItem href="/admin/batches" icon="ti ti-tags">Lotes</MenuItem>}
          {canAccess('entry-note') && <MenuItem href="/admin/entry-note" icon="ti ti-file-plus">Nota de Entrada</MenuItem>}
          {canAccess('exit-note') && <MenuItem href="/admin/exit-note" icon="ti ti-file-minus">Nota de Salida</MenuItem>}
          {canAccess('suppliers') && <MenuItem href="/admin/suppliers" icon="ti ti-truck">Proveedores</MenuItem>}
          {canAccess('units-of-measure') && <MenuItem href="/admin/units-of-measure" icon="ti ti-scale">Und. de medida</MenuItem>}
        </MenuItemContainer>

        <MenuItemContainer title='Administración' icon='ti ti-credit-card'>
          {canAccess('accounts-payable') && <MenuItem href="/admin/accounts-payable" icon="ti ti-credit-card">Cuentas por pagar</MenuItem>}
          {canAccess('expenses') && <MenuItem href="/admin/expenses" icon="ti ti-receipt">Gasto</MenuItem>}
          {canAccess('daily-summary') && <MenuItem href="/admin/daily-summary" icon="ti ti-calendar-stats">Resumen diario</MenuItem>}
        </MenuItemContainer>

        <MenuItemContainer title='Comercial' icon='ti ti-briefcase'>
          {canAccess('clients') && <MenuItem href="/admin/clients" icon="ti ti-users">Clientes</MenuItem>}
          {canAccess('eventual-clients') && <MenuItem href="/admin/eventual-clients" icon="ti ti-user-star">Clientes Eventual</MenuItem>}
          {canAccess('client-distribution') && <MenuItem href="/admin/client-distribution" icon="ti ti-map-pin-share">Red distribucion</MenuItem>}
          {canAccess('accounts-receivable') && <MenuItem href="/admin/accounts-receivable" icon="ti ti-credit-card-off">Cuenta por Cobrar</MenuItem>}
          {canAccess('orders') && <MenuItem href="/admin/commercial-orders" icon="ti ti-shopping-cart">Pedido</MenuItem>}
          {canAccess('pricing') && <MenuItem href="/admin/pricing" icon="ti ti-tag">Tarifario</MenuItem>}
        </MenuItemContainer>

        <MenuItemContainer title='Serv. Almacen...' icon='ti ti-building-warehouse'>
          {canAccess('storage-inventory') && <MenuItem href="/admin/storage-inventory" icon="ti ti-stack-2">Inventario</MenuItem>}
          {canAccess('storage-clients') && <MenuItem href="/admin/storage-clients" icon="ti ti-users">Clientes</MenuItem>}
          {canAccess('service-orders') && <MenuItem href="/admin/service-orders" icon="ti ti-file-dollar">O. Servicio</MenuItem>}
          {canAccess('storage-units') && <MenuItem href="/admin/storage-units" icon="ti ti-scale">Und. de medida</MenuItem>}
          {canAccess('storage-products') && <MenuItem href="/admin/storage-products" icon="ti ti-box">Creación del produ...</MenuItem>}
          {canAccess('storage-entry-note') && <MenuItem href="/admin/storage-entry-note" icon="ti ti-file-plus">Nota de entrada</MenuItem>}
          {canAccess('storage-exit-note') && <MenuItem href="/admin/storage-exit-note" icon="ti ti-file-minus">Nota de salida</MenuItem>}
          {canAccess('storage-kardex') && <MenuItem href="/admin/storage-kardex" icon="ti ti-file-text">Kardex</MenuItem>}
          {canAccess('storage-general-service') && <MenuItem href="/admin/storage-general-service" icon="ti ti-briefcase">Servicio General</MenuItem>}
          {canAccess('storage-billing-control') && <MenuItem href="/admin/storage-billing-control" icon="ti ti-receipt-2">Control de Factura...</MenuItem>}
          {canAccess('storage-general-service-orders') && <MenuItem href="/admin/storage-general-service-orders" icon="ti ti-file-invoice">O. Servicio General</MenuItem>}
        </MenuItemContainer>

        <MenuItemContainer title='Despacho' icon='ti ti-truck'>
          {canAccess('activity') && <MenuItem href="/admin/activity" icon="ti ti-activity">Actividad</MenuItem>}
          {canAccess('driver') && <MenuItem href="/admin/driver" icon="ti ti-user-circle">Conductor</MenuItem>}
          {canAccess('dispatch') && <MenuItem href="/admin/dispatch" icon="ti ti-truck-delivery">Despacho</MenuItem>}
          {canAccess('vehicle-zone') && <MenuItem href="/admin/vehicle-zone" icon="ti ti-map-2">Vehículo / Zona</MenuItem>}
        </MenuItemContainer>

        <MenuItemContainer title='Servicios' icon='ti ti-briefcase'>
          {canAccess('services-client') && <MenuItem href="/admin/services-client" icon="ti ti-user">Cliente</MenuItem>}
          {canAccess('services-billing') && <MenuItem href="/admin/services-billing" icon="ti ti-file-invoice">Facturación</MenuItem>}
          {canAccess('services-service-order') && <MenuItem href="/admin/services-service-order" icon="ti ti-file-dollar">Orden de servicio</MenuItem>}
          {canAccess('services-services') && <MenuItem href="/admin/services-services" icon="ti ti-settings">Servicios</MenuItem>}
        </MenuItemContainer>

        <MenuItemContainer title='Muestras' icon='ti ti-flask'>
          {canAccess('sample-orders') && <MenuItem href="/admin/sample-orders" icon="ti ti-file-text">Pedido</MenuItem>}
        </MenuItemContainer>

        <MenuItemContainer title='Magistrales' icon='ti ti-pills'>
          {canAccess('magistrales-articles') && <MenuItem href="/admin/magistrales-articles" icon="ti ti-box">Artículos</MenuItem>}
          {canAccess('magistrales-category') && <MenuItem href="/admin/magistrales-category" icon="ti ti-category">Categoría</MenuItem>}
          {canAccess('magistrales-formats') && <MenuItem href="/admin/magistrales-formats" icon="ti ti-file-description">Formatos</MenuItem>}
          {canAccess('magistrales-formulas') && <MenuItem href="/admin/magistrales-formulas" icon="ti ti-file-analytics">Fórmulas</MenuItem>}
          {canAccess('magistrales-incomes') && <MenuItem href="/admin/magistrales-incomes" icon="ti ti-file-plus">Ingresos</MenuItem>}
          {canAccess('magistrales-inventory') && <MenuItem href="/admin/magistrales-inventory" icon="ti ti-stack-2">Inventario</MenuItem>}
          {canAccess('magistrales-kardex') && <MenuItem href="/admin/magistrales-kardex" icon="ti ti-file-text">Kardex</MenuItem>}
          {canAccess('magistrales-laboratory') && <MenuItem href="/admin/magistrales-laboratory" icon="ti ti-flask">Laboratorio</MenuItem>}
          {canAccess('magistrales-purchase-order') && <MenuItem href="/admin/magistrales-purchase-order" icon="ti ti-shopping-cart">O. Compra</MenuItem>}
          {canAccess('magistrales-production-order') && <MenuItem href="/admin/magistrales-production-order" icon="ti ti-file-dollar">O. Producción</MenuItem>}
          {canAccess('magistrales-supplier') && <MenuItem href="/admin/magistrales-supplier" icon="ti ti-truck">Proveedor</MenuItem>}
          {canAccess('magistrales-responsible') && <MenuItem href="/admin/magistrales-responsible" icon="ti ti-user-check">Responsable</MenuItem>}
          {canAccess('magistrales-outputs') && <MenuItem href="/admin/magistrales-outputs" icon="ti ti-file-minus">Salidas</MenuItem>}
          {canAccess('magistrales-unit') && <MenuItem href="/admin/magistrales-unit" icon="ti ti-scale">Unidad</MenuItem>}
          {canAccess('magistrales-sales') && <MenuItem href="/admin/magistrales-sales" icon="ti ti-currency-dollar">Ventas</MenuItem>}
        </MenuItemContainer> */}

        <li className="side-nav-title mt-2">Configuraciones</li>
        {canAccess('businesses') && <MenuItem href="/admin/businesses" icon="ti ti-building-store" badge='✓' badgeColor='danger'>Empresas</MenuItem>}
        <MenuItemContainer title="Gestión" icon="ti ti-users">
          {canAccess('users') && <MenuItem href="/admin/users" icon="ti ti-users" badge='✓'>Usuarios</MenuItem>}
          {canAccess('roles') && <MenuItem href="/admin/roles" icon="ti ti-user-check" badge='✓'>Roles</MenuItem>}
        </MenuItemContainer>
        <MenuItem href="/admin/profile" icon="ti ti-user" badge='✓'>Mi perfil</MenuItem>
        <MenuItem href="/admin/account" icon="ti ti-settings" badge='✓'>Mi cuenta</MenuItem>
        <MenuItem onClick={() => Logout()} icon="ti ti-logout">Cerrar sesión</MenuItem>
      </ul>
      <div className="clearfix"></div>
    </div>
  </div>
}

export default Menu
