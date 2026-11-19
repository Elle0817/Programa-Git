"""Servidor local del frontend Mi Guía Turístico.

Garantías:
  * Sirve SIEMPRE la carpeta donde está este archivo.
  * Escucha en IPv4 (127.0.0.1) e IPv6 (::1) para que "localhost" llegue a
    este mismo proceso sin importar qué dirección elija el navegador.
  * Puerto EXCLUSIVO: si otro proceso ya usa el 3000 (en Windows
    SO_REUSEADDR permitía convivir en silencio con un proceso viejo), este
    servidor se detiene con un mensaje claro en vez de arrancar "a medias".
  * Redirección 127.0.0.1 -> localhost TEMPORAL (307), nunca permanente, para
    que Chrome no cachee redirecciones antiguas.
  * Sin caché (no-store) y 404 con detalle en la consola.
  * /__estado devuelve PID, carpeta servida y páginas, para saber qué
    proceso responde realmente.
"""

import errno
import json
import os
import socket
import sys
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
PUERTO = 3000
PUERTO_API = 8080
ORIGEN = f"http://localhost:{PUERTO}"
PAGINAS = ["index", "servicios", "reservas", "clientes", "costos",
           "calendario", "reportes", "configuracion"]
ERRORES_PUERTO_OCUPADO = {errno.EADDRINUSE, errno.EACCES, 10048, 10013}


class FrontendHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(RAIZ), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def _host(self) -> str:
        host = self.headers.get("Host", "").lower()
        return host.rsplit(":", 1)[0] if not host.startswith("[") else host.split("]")[0] + "]"

    def _redirect_alias(self) -> bool:
        if self._host() not in ("127.0.0.1", "[::1]"):
            return False
        self.send_response(307)  # temporal: el navegador no lo guarda
        self.send_header("Location", f"{ORIGEN}{self.path}")
        self.send_header("Content-Length", "0")
        self.end_headers()
        return True

    def _estado(self, head: bool) -> None:
        cuerpo = json.dumps({
            "servidor": "frontend Mi Guia Turistico",
            "pid": os.getpid(),
            "carpeta": str(RAIZ),
            "paginas": {p: (RAIZ / f"{p}.html").is_file() for p in PAGINAS},
        }, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.end_headers()
        if not head:
            self.wfile.write(cuerpo)

    def _resolver(self, head: bool) -> bool:
        """True si la solicitud ya fue respondida."""
        if self._redirect_alias():
            return True
        ruta = self.path.split("?", 1)[0].split("#", 1)[0]
        if ruta == "/__estado":
            self._estado(head)
            return True
        if ruta == "/":
            self.path = "/index.html" + self.path[1:]
        elif "." not in ruta.rsplit("/", 1)[-1] and (RAIZ / (ruta.strip("/") + ".html")).is_file():
            self.path = "/" + ruta.strip("/") + ".html"  # /reservas -> reservas.html
        return False

    def do_GET(self) -> None:
        if not self._resolver(False):
            super().do_GET()

    def do_HEAD(self) -> None:
        if not self._resolver(True):
            super().do_HEAD()

    def send_error(self, code, message=None, explain=None) -> None:
        if code == 404:
            print(f"  [404] {self.path} (Host: {self.headers.get('Host')}) "
                  f"-> buscado en {RAIZ}", flush=True)
        super().send_error(code, message, explain)


class ServidorExclusivo(ThreadingHTTPServer):
    # Windows: SO_REUSEADDR deja convivir procesos en el mismo puerto -> exclusivo.
    # Linux/macOS: SO_REUSEADDR solo evita TIME_WAIT y no permite dos oyentes.
    allow_reuse_address = os.name != "nt"
    daemon_threads = True

    def server_bind(self) -> None:
        if os.name == "nt":
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        if self.address_family == socket.AF_INET6:
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 1)
        super().server_bind()


class ServidorIPv6(ServidorExclusivo):
    address_family = socket.AF_INET6


def abrir(clase, direccion):
    try:
        return clase((direccion, PUERTO), FrontendHandler)
    except OSError as error:
        if error.errno in ERRORES_PUERTO_OCUPADO or getattr(error, "winerror", None) in ERRORES_PUERTO_OCUPADO:
            print(f"\nERROR: el puerto {PUERTO} ({direccion}) ya está ocupado por OTRO proceso.\n"
                  "Ese proceso es el que está respondiendo en tu navegador, no este.\n"
                  "Ciérralo (iniciar-frontend.bat lo hace solo) y vuelve a ejecutar.\n"
                  "Puedes ver quién responde en: " + ORIGEN + "/__estado", flush=True)
            sys.exit(1)
        return None  # p. ej. el equipo no tiene IPv6


def api_disponible() -> bool:
    try:
        with socket.create_connection(("127.0.0.1", PUERTO_API), timeout=1):
            return True
    except OSError:
        return False


if __name__ == "__main__":
    os.chdir(RAIZ)
    faltan = [p + ".html" for p in PAGINAS if not (RAIZ / f"{p}.html").is_file()]
    if faltan:
        print("ERROR: faltan archivos en", RAIZ, ":", ", ".join(faltan), flush=True)
        sys.exit(1)

    servidores = [s for s in (abrir(ServidorExclusivo, "127.0.0.1"),
                              abrir(ServidorIPv6, "::1")) if s]
    for s in servidores[1:]:
        threading.Thread(target=s.serve_forever, daemon=True).start()

    print(f"Frontend Mi Guía Turístico (PID {os.getpid()})", flush=True)
    print(f"  Carpeta : {RAIZ}", flush=True)
    print(f"  Escucha : {', '.join(s.server_address[0] for s in servidores)}:{PUERTO}", flush=True)
    print(f"  Abrir   : {ORIGEN}/", flush=True)
    print(f"  Estado  : {ORIGEN}/__estado", flush=True)
    print(f"  API {PUERTO_API}: " + ("responde" if api_disponible()
          else "NO responde (inicia el backend; sin él los módulos mostrarán error de API)"), flush=True)
    try:
        servidores[0].serve_forever()
    except KeyboardInterrupt:
        pass
