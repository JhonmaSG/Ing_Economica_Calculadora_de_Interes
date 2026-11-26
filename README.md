# Calculadora de Ingeniería Económica

Herramienta educativa para resolver ejercicios de Ingeniería Económica con fórmulas, validaciones y procedimiento paso a paso.

## Acceso al Proyecto
https://jhonmasg.github.io/Ing_Economica_Calculadora_de_Interes/

## Módulos

1. **Interés compuesto:** calcula VP, VF, tasa o número de períodos.
2. **Equivalencia de tasas:** convierte tasas nominales, efectivas, vencidas y anticipadas entre distintas periodicidades.
3. **Anualidades:** resuelve anualidades ordinarias o vencidas, anticipadas, diferidas y generales para valor presente y valor futuro.
4. **Ecuación de valor:** lleva ingresos, pagos y deudas a una fecha focal común.
5. **Amortización:** calcula la cuota y genera tablas con los sistemas francés y alemán.

Los tipos relacionados se agrupan dentro de un módulo para evitar duplicar pantallas y fórmulas. La perpetuidad y la capitalización para alcanzar una meta no forman parte del flujo principal de esta versión.


## Alcance académico

Los resultados deben interpretarse como apoyo al estudio. La calculadora trabaja con períodos regulares y no considera seguros, comisiones, impuestos, fechas calendario ni tasas variables.

## Tecnologías

- HTML5, CSS3 y JavaScript vanilla.
- Bootstrap 5.3.3 y Bootstrap Icons.
- Chart.js 4.4.3 para visualizaciones.
- KaTeX 0.16.11 para fórmulas matemáticas.
- GitHub Pages para publicación.

La aplicación es estática: los cálculos se realizan en el navegador y no se envían datos a un servidor. Las librerías de interfaz, fórmulas, iconos y gráficas están incluidas localmente en `vendor/`, por lo que el proyecto puede ejecutarse sin conexión a Internet.

## Ejecución sin Internet

Copia todo el repositorio a la USB y abre `index.html` en un navegador. No elimines la carpeta `vendor/`, porque contiene las versiones locales de Bootstrap, Bootstrap Icons, KaTeX y Chart.js. Las fuentes del sistema se utilizan como respaldo cuando no hay conexión.
