const distLinePoint = (p1, p2, x0, y0) => {
	const dx = p2[0] - p1[0];
	const dy = p2[1] - p1[1];
	const num = Math.abs(dy * x0 - dx * y0 + p2[0] * p1[1] - p2[1] * p1[0]);
	const den = Math.sqrt(dy * dy + dx * dx);
	if (den == 0) console.error('distLinePoint(): division by zero');
	return num / den;
};

const linesIntersect = (p1, p2, p3, p4) => {
	if (p2[0] == p3[0] && p2[1] == p3[1]) return p2;
	if (p1[0] == p4[0] && p1[1] == p4[1]) return p1;
	// Pt = P1 + (P2 - P1)t
	// Pv = P3 + (P4 - P3)v
	const [a, b, c, d, e, f, g, h] = [
		p1[0],
		p2[0] - p1[0],
		p3[0],
		p4[0] - p3[0],
		p1[1],
		p2[1] - p1[1],
		p3[1],
		p4[1] - p3[1],
	];
	const v = (b * (e - g) + f * (c - a)) / (h * b - f * d);
	if (isNaN(v)) console.error('linesIntersect() err v: ', p1, p2, p3, p4);
	const safe = Math.abs(b) >= Math.abs(f);
	const t = safe ? (c - a + d * v) / b : (g - e + h * v) / f;
	if (isNaN(t)) console.error('linesIntersect() err t: ', p1, p2, p3, p4);
	return [a + b * t, e + f * t];
};

const pointInPolygon = (pts, x, y) => {

	const pointSide = (p0, p1, x, y) =>
		(p1[0] - p0[0]) * (y - p0[1]) - (x - p0[0]) * (p1[1] - p0[1]); // >0 left, =0 on, <0 right

	let wn = 0; // winding number
	for (let i = 0; i < pts.length - 1; i++) {
		const [p, pn] = [pts[i], pts[i + 1]];
		const above = p[1] <= y;
		if (above && pn[1] > y && pointSide(p, pn, x, y) > 0) wn++;
		else if (!above && pn[1] <= y && pointSide(p, pn, x, y) < 0) wn--;
	}
	return wn == 0 ? false : true;
};

const polygonWinding = pts => {
	const len = pts.length;
	let [minx, miny, mi] = [pts[0][0], pts[0][1], 0];
	for (let i = 1; i < len; i++) {
		const [pix, piy] = [pts[i][0], pts[i][1]];
		if (pix < minx || pix == minx && piy < miny) [minx, miny, mi] = [pix, piy, i];
	}
	const [mp, mn] = [mi != 0 ? mi - 1 : len - 2, mi != len - 1 ? mi + 1 : 1];
	const [a, b, c] = [pts[mp], pts[mi], pts[mn]];
	const det = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
	return det < 0 ? 1 : -1; // cw : ccw
};

const polygonOffset = (pts, width) => {

	let len = pts.length;
	const [pf, pl] = [pts[0], pts[len - 1]];
	const closed = pf[0] == pl[0] && pf[1] == pl[1] ? true : false;
	if (!closed) {
		pts.push(pf);
		len++;
	}

	// figure out if poly is cww or cw
	const cw = polygonWinding(pts);

	// calculate segments' normals; will point outwards if poly traversed cw
	const offset = cw * 0.5 * width;
	const [nou, nin] = [[], []];
	for (let i = 0; i < len - 1; i++) {
		const [pix, piy] = [pts[i][0], pts[i][1]];
		const [nx, ny] = [pts[i + 1][0] - pix, pts[i + 1][1] - piy];
		const amp = offset / Math.sqrt(nx * nx + ny * ny);
		const [tnx, tny] = [-ny * amp, nx * amp];
		nou[i] = [tnx, tny];
		nin[i] = [-tnx, -tny];
	}

	// new points in the dir of norms
	const offPoints = (nrm) => {

		let [ni, ni1] = [nrm[0], nrm[len - 2]];
		let [p1, p2, p3, p4] = [
			[pts[0][0] + ni[0], pts[0][1] + ni[1]],
			[pts[1][0] + ni[0], pts[1][1] + ni[1]],
			[pts[len - 2][0] + ni1[0], pts[len - 2][1] + ni1[1]],
			[pts[len - 1][0] + ni1[0], pts[len - 1][1] + ni1[1]],
		];

		const res = [];

		// fix beg points for open curves, so they are not new intersec but just tip offsets
		res[0] = res[len - 1] = closed ? linesIntersect(p1, p2, p3, p4) : p1;

		for (let i = 0; i < len - 2; i++) {
			ni1 = nrm[i + 1];
			[p3, p4] = [
				[pts[i + 1][0] + ni1[0], pts[i + 1][1] + ni1[1]],
				[pts[i + 2][0] + ni1[0], pts[i + 2][1] + ni1[1]]
			];
			res[i + 1] = linesIntersect(p1, p2, p3, p4);
			[p1, p2] = [p3, p4];
		}

		// same fix for end
		if (!closed) {
			const i = len - 2;
			res[i] = [pts[i][0] + nrm[i - 1][0], pts[i][1] + nrm[i - 1][1]];
		}

		return res;
	};

	const outline = offPoints(nou);
	const inline = offPoints(nin);
	
	if (closed) return [outline, inline];

	pts.pop();
	outline.pop();
	inline.pop();
	return [[...outline, ...(inline.reverse()), outline[0]], []];
};
