var width = 960,
    height = 500;

var projection = d3.geo.cylindricalEqualArea()
    .parallel(38.5)
    .scale(186)
    .precision(.1);

var circle = d3.geo.circle()
    .angle(89.9975572);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select("#earth").append("svg")
    .attr("width", width)
    .attr("height", height);

var night = svg.append("path")
    .attr("class", "night")
    .attr("d", path);

function redraw() {
  var sunPos = getSolarWGSPosition( Date.now() );
  var darknessAngle = 90 - Math.asin( (constants.meanRsun - constants.meanRearth) / sunPos.range ) * constants.rad2deg;
  night.datum(circle.origin([ -180+sunPos.lon, -sunPos.lat ]).angle(darknessAngle)).attr("d", path);
}

function redraw2(m) {
  var sunPos = getSolarWGSPosition( m);
  var darknessAngle = 90 - Math.asin( (constants.meanRsun - constants.meanRearth) / sunPos.range ) * constants.rad2deg;
  night.datum(circle.origin([ -180+sunPos.lon, -sunPos.lat ]).angle(darknessAngle)).attr("d", path);
}

d3.json("world-50m.json", function(error, world) {
  svg.append("path")
      .datum(topojson.object(world, world.objects.land))
      .attr("class", "land")
      .attr("d", path)
      .attr("fill", "#e3e3e3")
      .attr("stroke", "black")
      .attr("stroke-width", "0.8")
      .attr("opacity", 0.4)
  redraw();
});

var getSolarWGSPosition = function getSolarWGSPosition(time) {
  var eci_pos = getSolarECI(time);
  var wgs_pos = ECItoWGS84(eci_pos, time);
  return {lat: wgs_pos.latitude, lon: wgs_pos.longitude, range: eci_pos.w};
};

var getSolarECI = function getSolarECI(time) {
  var mjd, year, T, M, L, e, C, O, Lsa, nu, R, eps;
  var jd_utc = unix2jd( time / 1000 );
  mjd = jd_utc - 2415020.0;
  year = 1900 + mjd / 365.25;
  T = (mjd + constants.deltaUTCTT / 86400) / 36525.0;
  M = (( 358.47583 + ((35999.04975 * T) % 360) - (0.000150 + 0.0000033 * T) * (T*T) ) % 360) * constants.deg2rad;
  L = ((279.69668 + ((36000.76892 * T) % 360.0) + 0.0003025 * (T*T) ) % 360) * constants.deg2rad;
  e = 0.01675104 - (0.0000418 + 0.000000126 * T) * T;
  C = ((1.919460 - (0.004789 + 0.000014 * T) * T) * Math.sin(M) + (0.020094 - 0.000100 * T) * Math.sin(2 * M) + 0.000293 * Math.sin(3 * M)) * constants.deg2rad;
  O = ((259.18 - 1934.142 * T) % 360) * constants.deg2rad;
  Lsa = (L + C -((0.00569 - 0.00479 * Math.sin(O)) * constants.deg2rad)) % (2*Math.PI);
  nu = (M + C) % (2*Math.PI);
  R = 1.0000002 * (1.0 - (e*e)) / (1.0 + e * Math.cos(nu));
  eps = ((23.452294 - (0.0130125 + (0.00000164 - 0.000000503 * T) * T) * T + 0.00256 * Math.cos(O)) * constants.deg2rad);
  R = constants.au * R;
  var x = R * Math.cos (Lsa);
  var y = R * Math.sin (Lsa) * Math.cos (eps);
  var z = R * Math.sin (Lsa) * Math.sin (eps);
  var w = R;
  return { x : x, y : y, z : z, w : w }
};

var ECItoWGS84 = function ECItoWGS84(eci, time) {
  var jd_utc = unix2jd( time / 1000 );
  var theta = Math.atan2(eci.y, eci.x); // radians
  var lon = (theta - thetaG_JD(jd_utc)) % (2*Math.PI); // radians
  var r = Math.sqrt( (eci.x*eci.x) + (eci.y*eci.y) );
  var e2 = constants.f * (2 - constants.f);
  var lat = Math.atan2(eci.z, r); // radians
  var sin_phi, phi, c;
  do {
    phi = lat;
    sin_phi = Math.sin(phi);
    c = 1 / Math.sqrt(1 - e2 * (sin_phi*sin_phi));
    lat = Math.atan2(eci.z + constants.eqRearth * c * e2 * sin_phi, r);
  } while (Math.abs(lat - phi) > 1e-10);
  var alt = r / Math.cos(lat) - constants.eqRearth * c; // kilometers
  if (lat > (Math.PI / 2)) {
    lat -= (2 * Math.PI);
  }
  if (lon < -Math.PI) {
    lon += 2*Math.PI;
  }
  return {
    latitude:  lat * constants.rad2deg,
    longitude: lon * constants.rad2deg,
    altitude:  alt,
    theta:     theta * constants.rad2deg
  };
};

// ** Astronomical, Geodetic & Mathematical Constants ** //
var constants = {
  au: 149597870700, // [m] Astronomical unit
  deltaUTCTT: 67.184,
  deg2rad: 0.017453292519943295,
  rad2deg: 57.29577951308232,
  omega_E: 1.00273790934,
  f: 1/298.257222101, // Earth, reciprocal of flattening IERS 2010
  eqRearth: 6378.1366,     // Equatorial radius
  meanRearth: 6371.0,     // Mean radius
  meanRsun: 1.392684e8,     // Mean radius sun
  omega: 7.292115e-5, // Nominal mean angular vel. of Earth rotation
};

// Converts a UNIX timestamp to JD (Julian Date)
var unix2jd = function unix2jd(timestamp) {
  return (timestamp / 86400.0) + 2440587.5;
};

var thetaG_JD = function thetaG_JD(jd) {
  // Reference: The 1992 Astronomical Almanac, page B6.
  var UT, TU, GMST;
  UT = (jd + 0.5) % 1;
  jd = jd - UT;
  TU = (jd - 2451545.0) / 36525;
  GMST = 24110.54841 + TU * (8640184.812866 + TU * (0.093104 - TU * 6.2e-6));
  GMST = (GMST + 86400 * constants.omega_E * UT) % 86400;
  return (2*Math.PI) * GMST / 86400;
};
