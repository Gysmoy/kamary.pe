import 'tippy.js/dist/tippy.css'
import Logout from '../../Actions/Logout'
import MenuItem from './Menu/MenuItem'
import MenuItemContainer from './Menu/MenuItemContainer'
import LaravelSession from '../../Utils/LaravelSession'

const Menu = ({ can, hasRole, panel = null }) => {
  const mainRole = LaravelSession.roles?.[0] ?? { name: 'User' }

  const canAccess = (permission) => {
    return can(permission) || hasRole('Admin') || hasRole('Root')
  }

  const canAccessAny = (...permissions) => {
    return permissions.some(permission => canAccess(permission))
  }

  return (
    <div className='sidenav-menu'>
      <a href='/' className='logo'>
        <span className='logo-light'>
          <span className='logo-lg'><img src='/assets/img/logo.svg' alt='logo' /></span>
          <span className='logo-sm'><img src='/assets/img/icon.svg' alt='small logo' /></span>
        </span>

        <span className='logo-dark'>
          <span className='logo-lg'><img src='/assets/img/logo.svg' alt='dark logo' /></span>
          <span className='logo-sm'><img src='/assets/img/icon.svg' alt='small logo' /></span>
        </span>
      </a>

      <button className='button-sm-hover'>
        <i className='ri-circle-line align-middle'></i>
      </button>

      <button className='sidenav-toggle-button'>
        <i className='ri-menu-5-line fs-20'></i>
      </button>

      <button className='button-close-fullsidebar'>
        <i className='ti ti-x align-middle'></i>
      </button>

      <div data-simplebar>
        <div className='sidenav-user'>
          <div className='dropdown-center text-center'>
            <a
              className='topbar-link dropdown-toggle text-reset drop-arrow-none px-2'
              data-bs-toggle='dropdown'
              type='button'
              aria-haspopup='false'
              aria-expanded='false'
            >
              <img
                src={`/api/admin/profile/${LaravelSession.uuid}`}
                className='rounded-circle aspect-square border'
                style={{
                  width: '46px',
                  aspectRatio: 1,
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${LaravelSession.fullname}&color=448BCD&background=FFFFFF11`
                }}
                alt={LaravelSession.fullname}
              />
              <span className='d-flex justify-content-center gap-1 sidenav-user-name my-2'>
                <span>
                  <span className='mb-0 fw-semibold lh-base fs-15'>
                    {LaravelSession.name?.split(' ')[0]} {LaravelSession.lastname?.split(' ')[0]}
                  </span>
                  <p className='my-0 fs-13 text-muted'>{mainRole?.name}</p>
                </span>

                <i className='ri-arrow-down-s-line d-block sidenav-user-arrow align-middle'></i>
              </span>
            </a>
            <div className='dropdown-menu dropdown-menu-end'>
              <div className='dropdown-header noti-title'>
                <h6 className='text-overflow m-0'>Bienvenido</h6>
              </div>

              <a href='/admin/profile' className='dropdown-item'>
                <i className='ri-account-circle-line me-1 fs-16 align-middle'></i>
                <span className='align-middle'>Mi perfil</span>
              </a>

              <a href='/admin/account' className='dropdown-item'>
                <i className='ri-settings-2-line me-1 fs-16 align-middle'></i>
                <span className='align-middle'>Mi cuenta</span>
              </a>

              <div className='dropdown-divider'></div>

              <button className='dropdown-item active fw-semibold text-danger' onClick={() => Logout()}>
                <i className='ti ti-logout me-1 fs-16 align-middle'></i>
                <span className='align-middle'>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>

        <ul className='side-nav'>
          {canAccess('dashboard') && <MenuItem href='/admin/home' icon='ti ti-home'>Inicio</MenuItem>}

          {canAccessAny('businesses', 'users', 'roles', 'generals') && (
            <MenuItemContainer title='Sistemas' icon='ti ti-settings-cog'>
              {canAccess('businesses') && <MenuItem href='/admin/businesses' icon='ti ti-building'>Empresas</MenuItem>}
              {canAccess('businesses') && <MenuItem href='/admin/billing-settings' icon='ti ti-building-community'>Sedes y facturacion</MenuItem>}
              {canAccess('generals') && <MenuItem href='/admin/generals' icon='ti ti-settings'>Datos generales</MenuItem>}
              {canAccess('users') && <MenuItem href='/admin/users' icon='ti ti-users'>Usuarios</MenuItem>}
              {canAccess('roles') && <MenuItem href='/admin/roles' icon='ti ti-shield-lock'>Roles y permisos</MenuItem>}
            </MenuItemContainer>
          )}

          {canAccessAny('businesses', 'articles', 'inventory', 'kardex', 'laboratories', 'batches', 'entry-note', 'exit-note', 'suppliers', 'units-of-measure') && (
            <MenuItemContainer title='Almacén' icon='ti ti-building-warehouse'>
              {canAccess('articles') && <MenuItem href='/admin/articles' icon='ti ti-box'>Artículos</MenuItem>}
              {canAccessAny('businesses', 'exit-note') && <MenuItem href='/admin/warehouses' icon='ti ti-building-store'>Almacenes</MenuItem>}
              {canAccess('inventory') && <MenuItem href='/admin/inventory' icon='ti ti-stack-2'>Inventario</MenuItem>}
              {canAccess('kardex') && <MenuItem href='/admin/kardex' icon='ti ti-notebook'>Kardex</MenuItem>}
              {canAccess('laboratories') && <MenuItem href='/admin/laboratories' icon='ti ti-flask'>Laboratorios</MenuItem>}
              {canAccess('batches') && <MenuItem href='/admin/batches' icon='ti ti-box-multiple'>Lotes</MenuItem>}
              {canAccess('entry-note') && <MenuItem href='/admin/entry-note' icon='ti ti-file-import'>Nota de Entrada</MenuItem>}
              {canAccess('exit-note') && <MenuItem href='/admin/exit-note' icon='ti ti-file-export'>Nota de Salida</MenuItem>}
              {canAccess('suppliers') && <MenuItem href='/admin/suppliers' icon='ti ti-truck-delivery'>Proveedores</MenuItem>}
              {canAccess('units-of-measure') && <MenuItem href='/admin/units' icon='ti ti-ruler-measure'>Und. de medida</MenuItem>}
            </MenuItemContainer>
          )}

          {canAccessAny('purchase-orders', 'purchase-receipts', 'accounts-payable', 'expenses', 'daily-summary') && (
            <MenuItemContainer title='Administración' icon='ti ti-briefcase'>
              {canAccess('purchase-orders') && <MenuItem href='/admin/purchase-orders' icon='ti ti-shopping-cart'>O. Compra</MenuItem>}
              {canAccess('purchase-receipts') && <MenuItem href='/admin/purchase-receipts' icon='ti ti-receipt'>Recepción de compra</MenuItem>}
              {canAccess('accounts-payable') && <MenuItem href='/admin/accounts-payable' icon='ti ti-credit-card'>Cuentas por pagar</MenuItem>}
              {canAccess('expenses') && <MenuItem href='/admin/expenses' icon='ti ti-receipt'>Gasto</MenuItem>}
              {canAccess('daily-summary') && <MenuItem href='/admin/daily-summary' icon='ti ti-calendar-stats'>Resumen diario</MenuItem>}
            </MenuItemContainer>
          )}

          {canAccessAny('clients', 'eventual-clients', 'accounts-receivable', 'take-orders', 'orders', 'pricing', 'client-distribution') && (
            <MenuItemContainer title='Comercial' icon='ti ti-shopping-bag'>
              {canAccess('clients') && <MenuItem href='/admin/clients' icon='ti ti-user-square'>Cliente</MenuItem>}
              {canAccess('eventual-clients') && <MenuItem href='/admin/eventual-clients' icon='ti ti-users'>Clientes Eventual</MenuItem>}
              {canAccess('client-distribution') && <MenuItem href='/admin/client-distribution' icon='ti ti-route'>Red de distribución</MenuItem>}
              {canAccess('accounts-receivable') && <MenuItem href='/admin/accounts-receivable' icon='ti ti-cash-banknote'>Cuenta por Cobrar</MenuItem>}
              {canAccess('take-orders') && <MenuItem href='/admin/comercial/tomapedido' icon='ti ti-clipboard-list'>Toma pedido</MenuItem>}
              {canAccess('orders') && <MenuItem href='/admin/commercial-orders' icon='ti ti-basket' exact>Pedido</MenuItem>}
              {canAccess('orders') && <MenuItem href='/admin/commercial-orders/multivende' icon='ti ti-plug-connected'>Pedidos Multivende</MenuItem>}
              {canAccess('pricing') && <MenuItem href='/admin/pricing' icon='ti ti-tags'>Tarifario</MenuItem>}
            </MenuItemContainer>
          )}

          {canAccessAny('storage-inventory', 'storage-clients', 'storage-service-orders', 'storage-units', 'storage-products', 'storage-entry-note', 'storage-exit-note', 'storage-kardex', 'storage-general-service', 'storage-billing-control', 'storage-general-service-orders') && (
            <MenuItemContainer title='Serv. Almacenamiento' icon='ti ti-building-warehouse'>
              {canAccess('storage-inventory') && <MenuItem href='/admin/storage-inventory' icon='ti ti-stack-2'>Inventario</MenuItem>}
              {canAccess('storage-clients') && <MenuItem href='/admin/storage-clients' icon='ti ti-users'>Clientes</MenuItem>}
              {canAccess('storage-service-orders') && <MenuItem href='/admin/storage-service-orders' icon='ti ti-list-details'>O. Servicio</MenuItem>}
              {canAccess('storage-units') && <MenuItem href='/admin/storage-units' icon='ti ti-ruler-measure'>Und. de medida</MenuItem>}
              {canAccess('storage-products') && <MenuItem href='/admin/storage-products' icon='ti ti-box'>Creación del producto</MenuItem>}
              {canAccess('storage-entry-note') && <MenuItem href='/admin/storage-entry-note' icon='ti ti-file-import'>Nota de entrada</MenuItem>}
              {canAccess('storage-exit-note') && <MenuItem href='/admin/storage-exit-note' icon='ti ti-file-export'>Nota de salida</MenuItem>}
              {canAccess('storage-kardex') && <MenuItem href='/admin/storage-kardex' icon='ti ti-notebook'>Kardex</MenuItem>}
              {canAccess('storage-general-service') && <MenuItem href='/admin/storage-general-service' icon='ti ti-briefcase'>Servicio General</MenuItem>}
              {canAccess('storage-billing-control') && <MenuItem href='/admin/storage-billing-control' icon='ti ti-receipt-2'>Control de Facturación</MenuItem>}
              {canAccess('storage-general-service-orders') && <MenuItem href='/admin/storage-general-service-orders' icon='ti ti-file-invoice'>O. Servicio General</MenuItem>}
            </MenuItemContainer>
          )}

          {canAccessAny('activity', 'driver', 'dispatch', 'vehicle-zone') && (
            <MenuItemContainer title='Despacho' icon='ti ti-truck-delivery'>
              {canAccess('activity') && <MenuItem href='/admin/activity' icon='ti ti-activity'>Actividad</MenuItem>}
              {canAccess('driver') && <MenuItem href='/admin/driver' icon='ti ti-user-circle'>Conductor</MenuItem>}
              {canAccess('dispatch') && <MenuItem href='/admin/driver-routes' icon='ti ti-route'>Ruta conductor</MenuItem>}
              {canAccess('dispatch') && <MenuItem href='/admin/picking' icon='ti ti-list-check'>Preparacion</MenuItem>}
              {canAccess('dispatch') && <MenuItem href='/admin/dispatch' icon='ti ti-truck-delivery'>Despacho</MenuItem>}
              {canAccess('vehicle-zone') && <MenuItem href='/admin/vehicle-zone' icon='ti ti-map-2'>Vehículo / Zona</MenuItem>}
            </MenuItemContainer>
          )}

          {canAccessAny('services-client', 'services-billing', 'services-service-order', 'services-services') && (
            <MenuItemContainer title='Servicios' icon='ti ti-settings'>
              {canAccess('services-client') && <MenuItem href='/admin/services-client' icon='ti ti-users'>Cliente</MenuItem>}
              {canAccess('services-billing') && <MenuItem href='/admin/services-billing' icon='ti ti-file-invoice'>Facturacion</MenuItem>}
              {canAccess('services-billing') && <MenuItem href='/admin/billing-settings' icon='ti ti-file-settings'>Config. facturación</MenuItem>}
              {canAccess('services-service-order') && <MenuItem href='/admin/services-service-order' icon='ti ti-file-dollar'>Orden de servicio</MenuItem>}
              {canAccess('services-services') && <MenuItem href='/admin/services-services' icon='ti ti-settings'>Servicios</MenuItem>}
            </MenuItemContainer>
          )}

          {canAccess('sample-orders') && (
            <MenuItemContainer title='Muestras' icon='ti ti-vial'>
              <MenuItem href='/admin/sample-orders' icon='ti ti-basket'>Pedido</MenuItem>
            </MenuItemContainer>
          )}

          {canAccessAny('orders', 'inventory') && (
            <MenuItemContainer title='Reportes' icon='ti ti-chart-bar'>
              {canAccess('orders') && <MenuItem href='/admin/reports/sales' icon='ti ti-chart-line'>Ventas</MenuItem>}
              {canAccess('inventory') && <MenuItem href='/admin/reports/inventory' icon='ti ti-report-analytics'>Inventario</MenuItem>}
            </MenuItemContainer>
          )}

          {canAccessAny(
            'magistrales-dashboard',
            'magistrales-products',
            'magistrales-procurement',
            'magistrales-warehouse',
            'magistrales-billing',
            'magistrales-articles',
            'magistrales-category',
            'magistrales-formats',
            'magistrales-formulas',
            'magistrales-incomes',
            'magistrales-inventory',
            'magistrales-kardex',
            'magistrales-laboratory',
            'magistrales-purchase-order',
            'magistrales-production-order',
            'magistrales-supplier',
            'magistrales-responsible',
            'magistrales-outputs',
            'magistrales-unit',
            'magistrales-sales',
          ) && (
            <MenuItemContainer title='Magistrales' icon='ti ti-flask-2'>
              {canAccess('magistrales-dashboard') && <MenuItem href='/admin/magistrales/dashboard' icon='ti ti-dashboard'>Dashboard</MenuItem>}
              {canAccessAny('magistrales-articles', 'magistrales-products') && <MenuItem href='/admin/magistrales/articles' icon='ti ti-box'>Artículos</MenuItem>}
              {canAccessAny('magistrales-category', 'magistrales-products') && <MenuItem href='/admin/magistrales-category' icon='ti ti-category'>Categoría</MenuItem>}
              {canAccessAny('magistrales-formats', 'magistrales-products') && <MenuItem href='/admin/magistrales-formats' icon='ti ti-forms'>Formatos</MenuItem>}
              {canAccessAny('magistrales-formulas', 'magistrales-products') && <MenuItem href='/admin/magistrales-formulas' icon='ti ti-test-pipe'>Fórmulas</MenuItem>}
              {canAccessAny('magistrales-incomes', 'magistrales-procurement') && <MenuItem href='/admin/magistrales/entry-note' icon='ti ti-file-import'>Nota de entrada</MenuItem>}
              {canAccessAny('magistrales-inventory', 'magistrales-warehouse') && <MenuItem href='/admin/magistrales/inventory' icon='ti ti-stack-2'>Inventario</MenuItem>}
              {canAccessAny('magistrales-kardex', 'magistrales-warehouse') && <MenuItem href='/admin/magistrales/kardex' icon='ti ti-notebook'>Kardex</MenuItem>}
              {canAccessAny('magistrales-laboratory', 'magistrales-products') && <MenuItem href='/admin/magistrales-laboratory' icon='ti ti-flask'>Laboratorio</MenuItem>}
              {canAccessAny('magistrales-purchase-order', 'magistrales-procurement') && <MenuItem href='/admin/magistrales/purchase-orders' icon='ti ti-shopping-cart'>O. Compra</MenuItem>}
              {canAccessAny('magistrales-production-order', 'magistrales-warehouse') && <MenuItem href='/admin/magistrales-production-order' icon='ti ti-clipboard-list'>O. Producción</MenuItem>}
              {canAccessAny('magistrales-supplier', 'magistrales-procurement') && <MenuItem href='/admin/magistrales/suppliers' icon='ti ti-truck-delivery'>Proveedor</MenuItem>}
              {canAccessAny('magistrales-responsible', 'magistrales-warehouse') && <MenuItem href='/admin/magistrales-responsible' icon='ti ti-user-check'>Responsable</MenuItem>}
              {canAccessAny('magistrales-outputs', 'magistrales-warehouse') && <MenuItem href='/admin/magistrales-outputs' icon='ti ti-file-export'>Salidas</MenuItem>}
              {canAccessAny('magistrales-unit', 'magistrales-products') && <MenuItem href='/admin/magistrales-unit' icon='ti ti-ruler-measure'>Unidad</MenuItem>}
              {canAccessAny('magistrales-sales', 'magistrales-billing') && <MenuItem href='/admin/magistrales-sales' icon='ti ti-cash'>Ventas</MenuItem>}
              {canAccess('magistrales-billing') && <MenuItem href='/admin/magistrales/billing-settings' icon='ti ti-file-settings'>Config. facturación</MenuItem>}
            </MenuItemContainer>
          )}
        </ul>

        <div className='clearfix'></div>
      </div>
    </div>
  )
}

export default Menu
