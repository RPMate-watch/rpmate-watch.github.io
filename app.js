(function () {
    'use strict';

    var RANGE_MAX = 5000;
    var MAX_POINTS = 60;

    var running = true;
    var load = 50;

    function baseFromLoad(l) {
        return 400 + l * 40;
    }

    function simulatedValue(tick, l) {
        var wave = Math.sin(tick / 6) * 120;
        var noise = (Math.random() - 0.5) * 90;
        return Math.max(60, Math.round(baseFromLoad(l) + wave + noise));
    }

    var history = [];
    for (var i = 0; i < 40; i++) history.push(simulatedValue(i, 50));

    var currentEl = document.getElementById('rpm-current');
    var maxEl = document.getElementById('rpm-max');
    var minEl = document.getElementById('rpm-min');
    var badgeEl = document.getElementById('rpm-badge');
    var readoutEl = document.getElementById('rpm-readout');
    var toggleBtn = document.getElementById('rpm-toggle');
    var loadInput = document.getElementById('rpm-load');
    var loadValue = document.getElementById('rpm-load-value');
    var tableBody = document.querySelector('#rpm-data-table tbody');
    var canvas = document.getElementById('rpm-chart');
    var ctx = canvas.getContext('2d');

    function fmt(v) {
        return v.toLocaleString('en-US');
    }

    function drawChart() {
        var dpr = window.devicePixelRatio || 1;
        var w = canvas.clientWidth;
        var h = canvas.clientHeight;
        if (!w) return;
        if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
            canvas.width = w * dpr;
            canvas.height = h * dpr;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        var padL = 44, padR = 10, padT = 12, padB = 24;
        var plotW = w - padL - padR;
        var plotH = h - padT - padB;

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.14)';
        ctx.fillStyle = '#6b7f9c';
        ctx.font = '11px ui-monospace, Menlo, Consolas, monospace';
        ctx.textAlign = 'right';
        ctx.lineWidth = 1;
        var steps = 5;
        for (var g = 0; g <= steps; g++) {
            var val = (RANGE_MAX / steps) * g;
            var y = padT + plotH - (val / RANGE_MAX) * plotH;
            ctx.beginPath();
            ctx.moveTo(padL, y);
            ctx.lineTo(w - padR, y);
            ctx.stroke();
            ctx.fillText(fmt(val), padL - 6, y + 4);
        }

        ctx.textAlign = 'center';
        ctx.fillText('60s ago', padL, h - 6);
        ctx.fillText('now', w - padR - 12, h - 6);

        var n = history.length;
        if (n < 2) return;
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (var p = 0; p < n; p++) {
            var x = padL + (p / (MAX_POINTS - 1)) * plotW;
            var vy = padT + plotH - (Math.min(history[p], RANGE_MAX) / RANGE_MAX) * plotH;
            if (p === 0) ctx.moveTo(x, vy); else ctx.lineTo(x, vy);
        }
        ctx.stroke();

        var lastX = padL + ((n - 1) / (MAX_POINTS - 1)) * plotW;
        var lastY = padT + plotH - (Math.min(history[n - 1], RANGE_MAX) / RANGE_MAX) * plotH;
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(lastX, lastY, 3.5, 0, Math.PI * 2);
        ctx.fill();
    }

    function renderStats() {
        var current = history[history.length - 1];
        var max = Math.max.apply(null, history);
        var min = Math.min.apply(null, history);
        currentEl.textContent = fmt(current);
        maxEl.textContent = fmt(max);
        minEl.textContent = fmt(min);
        readoutEl.textContent = 'Latest reading: ' + fmt(current) + ' RPM (simulated)';
    }

    function renderTable() {
        var html = '';
        for (var i = history.length - 1; i >= 0; i--) {
            var ago = history.length - 1 - i;
            var label = ago === 0 ? 'now' : ago + 's ago';
            html += '<tr><th scope="row">' + label + '</th><td>' + fmt(history[i]) + ' RPM</td></tr>';
        }
        tableBody.innerHTML = html;
    }

    function renderAll() {
        renderStats();
        drawChart();
        renderTable();
    }

    setInterval(function () {
        if (!running) return;
        history.push(simulatedValue(Date.now() / 1000, load));
        if (history.length > MAX_POINTS) history.shift();
        renderAll();
    }, 1000);

    toggleBtn.addEventListener('click', function () {
        running = !running;
        toggleBtn.textContent = running ? 'Pause simulation' : 'Resume simulation';
        badgeEl.textContent = running ? 'Simulating' : 'Paused';
        badgeEl.className = running ? 'rpm-badge rpm-badge-live' : 'rpm-badge';
    });

    loadInput.addEventListener('input', function () {
        load = parseInt(loadInput.value, 10);
        loadValue.textContent = load + '% load';
    });

    window.addEventListener('resize', drawChart);

    renderAll();
})();
