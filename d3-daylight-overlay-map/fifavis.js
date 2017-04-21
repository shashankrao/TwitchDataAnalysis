// calculate local time in a different city given the city's UTC offset
function calcTime(d, offset) {

    date = new Date(d);
    // convert to msec
    // add local time zone offset
    // get UTC time in msec
    var utc = date.getTime() + (date.getTimezoneOffset() * 60000);

    // create new Date object for different city
    // using supplied offset
    var newDate = new Date(utc + (3600000 * offset));

    // return time as a string
    return ("0" + newDate.getHours()).slice(-2) +  ":" + ("0" + newDate.getMinutes()).slice(-2);
}

var chart = c3.generate({
    size: {
        width: 960,
        height: 200
    },
    data: {
        x: 'x',
        xFormat: '%Y-%m-%dT%H:%M:%S.%LZ',
        columns: [
            overallx,
            fifaviewers
        ]
    },
    point: {
        show: false
    },
    axis: {
        x: {
            type: 'timeseries',
            localtime: false,
             tick: {
            format: function(d) {
              var m = new Date(d);

              //console.log(m.getTimezoneOffset());
              m.setMinutes(m.getMinutes() - m.getTimezoneOffset());

              d3.select("#chn-time").text(calcTime(m, "+8"));
              d3.select("#kor-time").text(calcTime(m, "+9"));
              d3.select("#eur-time").text(calcTime(m, "+0"));
              d3.select("#eur-time").text(calcTime(m, "+0"));
              d3.select("#use-time").text(calcTime(m, "-4"));
              d3.select("#usw-time").text(calcTime(m, "-7"));

              redraw2(m);

              return m.toLocaleString((window.navigator.userLanguage || window.navigator.language), {
                hour12: false
              });
            },
            values: ['2017-03-29T00:00:00.000Z', '2017-04-03T00:00:00.000Z', '2017-04-09T00:00:00.000Z', '2017-04-15T00:00:00.000Z'],
            multiline: true,
            count: 4
            }
        }
    }
});
