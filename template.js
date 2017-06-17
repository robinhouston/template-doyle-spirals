window.template = (function() {
    var state = {
        p: 9, q: 24, ms_per_repeat: 3000,
        colors: "#4499BB, #483352, #486078",
        color_offset: 0,
        color_q_arms: false,
    };

    var canvas, context, root, colors;

    // Circle drawing
    function circle(x, y, r) {
        context.beginPath();
        context.arc(x, y, r, 0, 7, false);
        context.fill();
    }

    // Complex arithmetic
    function cmul(w, z) {
        return [
            w[0]*z[0] - w[1]*z[1],
            w[0]*z[1] + w[1]*z[0]
        ];
    }
    function modulus(p) {
        return Math.sqrt(p[0]*p[0] + p[1]*p[1]);
    }
    function crecip(z) {
        var d = z[0]*z[0] + z[1]*z[1];
        return [z[0]/d, -z[1]/d];
    }

    // Doyle spiral drawing
    function drawArm(r, start_point, delta, options) {
        var recip_delta = crecip(delta),
            mod_delta = modulus(delta),
            mod_recip_delta = 1/mod_delta,
            color_index = options.i,
            colors = options.fill,
            min_d = options.min_d,
            max_d = options.max_d;

        // Spiral outwards
        for (var q = start_point, mod_q = modulus(q);
            mod_q < max_d;
            q = cmul(q, delta), mod_q *= mod_delta
        ) {
            context.fillStyle = colors[color_index];
            circle(q[0], q[1], mod_q*r);
            color_index = (color_index + 1) % colors.length;
        }

        // Spiral inwards
        color_index = ((options ? options.i : 0) + colors.length - 1) % colors.length;
        for (var q = cmul(start_point, recip_delta), mod_q = modulus(q);
            mod_q > min_d;
            q = cmul(q, recip_delta), mod_q *= mod_recip_delta
        ) {
            context.fillStyle = colors[color_index];
            circle(q[0], q[1], mod_q*r);
            color_index = (color_index + colors.length - 1) % colors.length;
        }
    }

    function drawSpiral(start, min_d, max_d) {
        for (var i=0; i<state.q; i++) {
            drawArm(root.r, start, root.a, {
                fill: colors, i: (i*state.color_offset)%colors.length,
                min_d: min_d, max_d: max_d
            });
            start = cmul(start, root.b);
        }
    }

    function drawSpiralAlt(start, min_d, max_d) {
        for (var i=0; i<state.q; i++) {
            drawArm(root.r, start, root.a, {
                fill: [colors[i % colors.length]], i: 0,
                min_d: min_d, max_d: max_d
            });
            start = cmul(start, root.b);
        }
    }

    function frame(t) {
        var w = window.innerWidth,
            h = window.innerHeight,
            d = window.devicePixelRatio;
        if (canvas.width != w*d) { canvas.width = w*d; canvas.style.width = w + "px"; }
        if (canvas.height != h*d) { canvas.height = h*d; canvas.style.height = h + "px"; }

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);

        context.translate(Math.round(canvas.width/2), cy = Math.round(canvas.height/2));
        var scale = Math.pow(root.mod_a, t);
        context.scale(scale, scale);
        context.rotate(root.arg_a * t);

        (state.color_q_arms ? drawSpiralAlt : drawSpiral)(root.a, 1/scale, canvas.width * 2);
    }

    var first_timestamp;
    function loop(timestamp) {
        if (!first_timestamp) first_timestamp = timestamp;
        frame(((timestamp - first_timestamp) % (state.ms_per_repeat*colors.length)) / state.ms_per_repeat);
        requestAnimationFrame(loop);
    }

   function draw() {
        // Initialisation
        canvas = document.getElementsByTagName("canvas")[0];
        context = canvas.getContext("2d");
        update();

        // Animation
        requestAnimationFrame(loop);
    }

    function checkPositive(x) { if (x <= 0) throw new Error("Must be positive"); }
    function checkInteger(x) { if (x != Math.round(x)) throw new Error("Must be a whole number"); }
    function checkPositiveInteger(x) { checkPositive(x); checkInteger(x); }

    function update() {
        checkPositiveInteger(state.p);
        checkPositiveInteger(state.q);
        checkPositive(state.ms_per_repeat);

        root = doyle(state.p, state.q);
        colors = state.colors.split(/\s*,\s*/);
    }

    return {
        state: state,
        draw: draw,
        update: update
    };
})();
