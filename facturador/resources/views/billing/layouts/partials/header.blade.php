<header class="header">
    <div class="logo-container">
        <div class="sidebar-toggle" data-toggle-class="sidebar-left-collapsed" data-target="html"
            data-fire-event="sidebar-left-toggle">
            <i class="fas fa-angle-left" aria-label="Toggle sidebar"></i>
            <i class="fas fa-angle-right" aria-label="Toggle sidebar"></i>
        </div>
        <div class="d-md-none toggle-sidebar-left" data-toggle-class="sidebar-left-opened" data-target="html"
            data-fire-event="sidebar-left-opened">
            <i class="fas fa-bars" aria-label="Toggle sidebar"></i>
        </div>
        <div class="header-title d-none d-md-block px-3" style="line-height: 60px;">
            <span class="font-weight-bold text-uppercase">Facturación Lite</span>
        </div>
    </div>
    <div class="header-right">

        <ul class="notifications mx-2">
            @if($vc_company->soap_type_id == "01")
                <li>
                    <a href="{{ url('/app/settings') }}" class="notification-icon text-secondary"
                        data-toggle="tooltip" data-placement="bottom" title="SUNAT: ENTORNO DE DEMOSTRACIÓN (ACTIVO)">
                        <i class="text-info fas fa-toggle-on mr-2"
                            style="font-size: 20px; color: #17a2b8 !important"></i>
                        <span>DEMO</span>
                    </a>
                </li>
            @elseif($vc_company->soap_type_id == "02")
                <li>
                    <a href="{{ url('/app/settings') }}" class="notification-icon text-secondary"
                        data-toggle="tooltip" data-placement="bottom" title="SUNAT: ENTORNO DE PRODUCCIÓN">
                        <i class="text-success fas fa-toggle-on mr-2"
                            style="font-size: 20px; color: #28a745 !important"></i>
                        <span>PROD</span>
                    </a>
                </li>
            @endif
        </ul>

        @if($vc_document > 0 || $vc_document_regularize_shipping > 0)
            <span class="separator"></span>
            <ul class="notifications">
                <li class="showed" id="dropdown-notifications">
                    <a href="#" id="dn-toggle" class="dropdown-toggle notification-icon" data-bs-toggle="dropdown"
                        aria-expanded="false">
                        <i class="far fa-bell text-secondary"></i>
                        <span class="badge badge-danger">!</span>
                    </a>

                    <div id="dn-menu" class="dropdown-menu notification-menu">
                        <div class="notification-title">Comprobantes</div>
                        <div class="content">
                            <ul>
                                @if($vc_document > 0)
                                    <li>
                                        <a href="{{ url('/app/documents') }}" class="clearfix">
                                            <div class="image">
                                                <div class="badge badge-pill badge-danger text-light">{{ $vc_document }}</div>
                                            </div>
                                            <span class="title">Documentos por enviar</span>
                                        </a>
                                    </li>
                                @endif
                            </ul>
                        </div>
                    </div>
                </li>
            </ul>
        @endif

        <span class="separator"></span>
        <div id="userbox" class="userbox">
            <a href="#" data-toggle="dropdown">
                <div class="profile-info">
                    <span class="name">{{ $vc_user->name }}</span>
                    <span class="role">{{ $vc_user->email }}</span>
                </div>
                <figure class="profile-picture">
                    <div class="border rounded-circle text-center" style="width: 25px;"><i class="fas fa-user"></i>
                    </div>
                </figure>
            </a>
            <div class="dropdown-menu">
                <ul class="list-unstyled mb-0">
                    <li class="divider"></li>
                    <li>
                        <a role="menuitem" href="{{ route('logout') }}"
                            onclick="event.preventDefault(); document.getElementById('logout-form').submit();">
                            <i class="fas fa-power-off"></i> @lang('app.buttons.logout')
                        </a>
                        <form id="logout-form" action="{{ route('logout') }}" method="POST" style="display: none;">
                            @csrf
                        </form>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</header>

