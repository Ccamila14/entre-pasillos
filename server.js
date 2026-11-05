const express = require('express');
const mysql = require('mysql2');

const app = express();
const PORT = 3000;

// Conexion con la base de datos
const conexion = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234hola',
    database: 'entre_pasillos'
});

// Comprobar la conexion con MySQL
conexion.connect((error) => {
    if (error) {
        console.log('Error al conectar con MySQL:', error.message);
        return;
    }

    console.log('Conexion con MySQL exitosa');

    // Iniciar el servidor
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Servidor funcionando en http://localhost:${PORT}`);
    });
});

// Permitir que Express lea formularios
app.use(express.urlencoded({ extended: true }));

// Mostrar los archivos del frontend
app.use(express.static('public'));


// Consultar los colegios guardados en MySQL
app.get('/colegios-db', (req, res) => {

    const consulta = 'SELECT * FROM colegios';

    conexion.query(consulta, (error, resultados) => {

        if (error) {
            res.send('Error al consultar los colegios');
            return;
        }

        let pagina = '<h1>Colegios de Entre Pasillos</h1>';

        pagina += '<ul>';

        resultados.forEach((colegio) => {
            pagina += `<li>${colegio.nombre}</li>`;
        });

        pagina += '</ul>';

        res.send(pagina);
    });

});
// Consultar las pantallas guardadas en MySQL
app.get('/pantallas-db', (req, res) => {

    const consulta = `
        SELECT
            pantallas.numero,
            pantallas.titulo,
            pantallas.contenido,
            colegios.nombre AS colegio
        FROM pantallas
        LEFT JOIN colegios
        ON pantallas.id_colegio = colegios.id_colegio
        ORDER BY pantallas.numero
    `;

    conexion.query(consulta, (error, resultados) => {

        if (error) {
            res.send('Error al consultar las pantallas');
            return;
        }

        let pagina = '<h1>Pantallas de Entre Pasillos</h1>';

        resultados.forEach((pantalla) => {

            pagina += `
                <h2>${pantalla.numero} - ${pantalla.titulo}</h2>
                <p>Colegio: ${pantalla.colegio || 'General'}</p>
                <p>${pantalla.contenido}</p>
                <hr>
            `;

        });

        res.send(pagina);

    });

});
// Consultar los botones guardados en MySQL
app.get('/botones-db', (req, res) => {

    const consulta = `
        SELECT
            botones.texto,
            origen.titulo AS pantalla_origen,
            destino.titulo AS pantalla_destino
        FROM botones
        INNER JOIN pantallas AS origen
        ON botones.id_pantalla_origen = origen.id_pantalla
        INNER JOIN pantallas AS destino
        ON botones.id_pantalla_destino = destino.id_pantalla
    `;

    conexion.query(consulta, (error, resultados) => {

        if (error) {
            res.send('Error al consultar los botones');
            return;
        }

        let pagina = '<h1>Botones de Entre Pasillos</h1>';

        resultados.forEach((boton) => {

            pagina += `
                <p>
                    Botón: ${boton.texto}<br>
                    Desde: ${boton.pantalla_origen}<br>
                    Hacia: ${boton.pantalla_destino}
                </p>
                <hr>
            `;

        });

        res.send(pagina);

    });

});
// Abrir una pantalla según su número
app.get('/pantalla/:numero', (req, res) => {

    const numero = req.params.numero;

    const consulta = `
        SELECT numero, titulo, contenido
        FROM pantallas
        WHERE numero = ?
    `;

    conexion.query(consulta, [numero], (error, resultados) => {

        if (error) {
            res.send('Error al buscar la pantalla');
            return;
        }

        if (resultados.length === 0) {
            res.send('No se encontró esa pantalla');
            return;
        }

        const pantalla = resultados[0];

        res.send(`
            <h1>${pantalla.titulo}</h1>
            <p>${pantalla.contenido}</p>
            <a href="/">Volver al inicio</a>
        `);

    });

});
// Navegar a otra pantalla usando el boton de MySQL
app.get('/ir/:idBoton', (req, res) => {

    const idBoton = req.params.idBoton;

    const consulta = `
        SELECT pantallas.archivo
        FROM botones
        INNER JOIN pantallas
        ON botones.id_pantalla_destino = pantallas.id_pantalla
        WHERE botones.id_boton = ?
    `;

    conexion.query(consulta, [idBoton], (error, resultados) => {

        if (error) {
            res.send('Error al buscar el destino del boton');
            return;
        }

        if (resultados.length === 0) {
            res.send('No se encontro el boton');
            return;
        }

        res.redirect('/' + resultados[0].archivo);

    });

});