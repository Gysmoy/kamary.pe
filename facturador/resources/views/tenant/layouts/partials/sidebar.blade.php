<aside id="sidebar-left" class="sidebar-left">
    <script>
        window.location.replace(@json(url('/app')));
    </script>

    <noscript>
    <div class="sidebar-header">
        <div class="sidebar-title">
            Frontend legacy deshabilitado
        </div>
    </div>
    <div class="nano">
        <div class="nano-content">
            <nav id="menu" class="nav-main" role="navigation">
                <ul class="nav nav-main">
                    <li class="nav-active">
                        <a class="nav-link" href="{{ url('/app') }}">
                            <i class="fas fa-external-link-alt" aria-hidden="true"></i>
                            <span>Ir al frontend React</span>
                        </a>
                    </li>
                </ul>
            </nav>
        </div>
    </div>
    </noscript>
</aside>
