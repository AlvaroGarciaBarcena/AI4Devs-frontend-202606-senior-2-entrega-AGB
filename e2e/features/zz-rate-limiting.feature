# Fuente: openspec/specs/authentication/spec.md (rama api-auth-AGB, commit bb94850)
# Requisito: "Límite de intentos de inicio de sesión"
#
# Aislado en su propio fichero, con nombre que ordena alfabéticamente el
# último de toda la suite (.features-gen conserva el nombre del .feature,
# y Playwright con fullyParallel:false/workers:1 ejecuta los ficheros de
# test en ese mismo orden) -- este escenario agota de verdad el limitador
# de login compartido por el resto de la suite durante ~15 minutos, así
# que ningún otro escenario que necesite iniciar sesión de verdad puede
# ejecutarse después de este dentro de la misma tanda sin reiniciar el
# backend primero.
Feature: Límite de intentos de inicio de sesión (aislado, se ejecuta el último)

  Scenario: Muchos intentos seguidos
    Given un mismo origen ya ha agotado el número de intentos de login permitidos en los últimos 15 minutos
    When ese origen realiza un intento adicional de inicio de sesión
    Then el sistema rechaza el intento con un código de límite de peticiones alcanzado
