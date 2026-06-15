

# Resumen de avance del proyecto 

importante : cada que se modifica la base de datos añadiendo una nueva migracion se debe borrar el .db por que el sistema no esta haciendo las migraciones si ya existe una bse de datos(no se por que) por lo que para correr la nueva version se debe buscar donde se guarda el archivo .db y borrarlo junto con el resto de contenido de esa carpeta, al volver a inciar la app se creara un nuevo y funcionara normalmente



### primer sprint 

El primer sprint esta terminado por completo exepto la hu 6 por la falta del lector de codigo de barras

### segundo sprint

- la hu 5 funciona pero no como se especifico en el backlog, no se pide una razon para modificar el stock manuealmente
(conversar con el ciente para saber si es necesario implementarlo de esa manera o si se deja la solucion actual)

- las hu 11 y 12 se malinterpretaron, el cliente vende prodcutos a granel pero no vende por partes es decir no pesa ninguno de los productos al momento de la venta, todo se vende por unidad por lo que no es necesario una implementacion para ventas por granel
(conversar con el cliente)

- la hu 15 fue implementada en otra hu de manera implicita era obvio que si se hace una venta se debe actualizar el stock automaticamente


- *A Implementar* la hu 18 se debe conversar con el clinete y revisar como implementarla para saber cuando lanzar la alerta, si modificar el home paara mostrar la informacion alli(la card de alertas de stock es la unica que no funciona en el login ) o que halla un sistema de notificaciones que avise sobre estos problemas, si se hace en el home solo se podran visualizar algunos productos con stock bajo 

### tercer sprint

  - las hu 17(del segundo sprint) y 19 practicamente se fusionarron en una sola 
  
  - *A Implementar* la hu 25 debe ser implementada en el tercer sprint aunque tambien me parece ambigua, la rentabilidad basica se calcula al momento de crear prodcuto y no depende de cuantas unidades se venden. no se si se debe calcular la rentabilidad de otra manera y guardarla en base de datos 
  
  - *A Implementar* la hu 26 se debe implementar donde se necesite revisar todas las opraciones criticas e implementar si falta la confirmacion
  - la hu 28 tambien se implemento en mediada que se iban desarollando otras funcionalidades 

  ## tareas qpor fuera del sprint 

  aunque no esten detalladas en el backlog creo que se deben implementar 

  - limpieza de la interfaz en general, revisar si hay botones, iconos o secciones que carezcan de utilidad y eliminarlas, ejemplo : boton cambiar contraseña en el home 
  - revisar y bloquear el acceso al usuario de tipo seller a todas las funcionalidades que solo pueden acceder los usuarios de tipo admin, como la seccion de reportes o cambio de contraseñas 
  - modificar el icono de la app en la barra de tareas 
  - al abrir la app en desarollo la ventana se abre en un tamaño fijo algo pequeño revisar si esto se puede modificar.