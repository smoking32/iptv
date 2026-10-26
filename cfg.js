// EDITA ESTOS DATOS
window.CFG = {

  servers: [

    // 1) Tu servidor Xtream: peliculas, series, fichas y TV en vivo
    { link: 'http://MUNDO2.PRO:80/get.php?username=JEFMENDEZ22&password=22mendezjef&type=m3u_plus',
      name: 'Mundo2' },

    { link: 'http://latinostream.xyz:80/get.php?username=L20260704&password=L20260704&type=m3u_plus',
     name: 'otrositv' },

    // 2) Tu lista de m3u4u. 'lista.js' y 'guia.js' los crea  relevo\ActualizarLista.bat  (ver LEEME.txt)
    { link: 'lista.js',
      name: 'Canales m3u4u',
      live: true,
      epg:  'guia.js' }

  ],

  liveHLS: false     // true = usar .m3u8 en vivo, false = .ts
};
