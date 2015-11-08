<html>
    <head>
        <style>
            html, body {
                margin: 0;
                padding: 0;
            }
        </style>
    </head>
    <body>
        <canvas id="myCanvas" width="800" height="600" style="border:1px solid #000000;"></canvas>
        <script type="text/javascript" src="assets/js/Utils.js"></script>
        <script type="text/javascript" src="assets/js/Project.js"></script>
        <script type="text/javascript" src="assets/js/Map.js"></script>
        <script type="text/javascript" src="assets/js/MapObject.js"></script>
        <script type="text/javascript" src="assets/js/Tile.js"></script>
        <script type="text/javascript">
            window.addEventListener("load", init);

            var Utils = new Utils();

            function init() {
                var imageSrcs = [];
                for (var i = 1; i <= 18; i++) {
                    imageSrcs.push('img/trees'+i+'.png');
                };
                imageSrcs.push('img/house1.png');
                imageSrcs.push('img/path_ew.png');
                imageSrcs.push('img/basic1.png');

                var myProject = new Project("myCanvas");
                Utils.preloadImages(imageSrcs, function() {
                    myProject.map.draw();
                });
            }
        </script>
    </body>
</html>
