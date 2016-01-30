var fs = require('fs');
var fromYear = 2014;
var request = require('request');
var async = require('async');
var url;

var city = {
    name: '北京市',
    englishName: 'beijing'
};

function doQuery(pageId, callback){
    require('sleep').sleep(3);
    url = 'http://datacenter.mep.gov.cn/report/air_daily/air_dairy.jsp?city=' + encodeURIComponent(city.name) + '&startdate=' + fromYear + '-01-01&enddate='+(fromYear+1)+'-01-01&page=';
    var u = {
        uri:url+pageId,
        headers:{
            'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9',
            'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Content-Type':'application/x-www-form-urlencoded'
        }
    };

    request(u, function (error, response, body) {
        console.log(u.uri);
        if (!error && response.statusCode == 200) {
            var firstIndex = response.body.indexOf('<area ');
            var lastIndex = response.body.lastIndexOf('</map>');
            var result = response.body.substring(firstIndex, lastIndex);
            result = result.replace(/<area shape="rect" coords="[^"]+" title="/g, '').replace(/">/g, '');
            console.log(result);
            fs.appendFileSync(fromYear.toString(), result);

            var regex = /总页数：<b><font color="#004e98">(\d+)<\/font>/;
            var m = regex.exec(response.body);
            if(m!=null){
                var totalPages = m[1];
                if(totalPages>pageId){
                    doQuery(++pageId, callback);
                }
                else{
                    console.log('completed, total pages:', totalPages);
                    callback(null, 1);
                }
            }
        }
        else{
            console.log(error);
        }
    });
}

async.series([
    function(callback){
        fromYear = 2015;
        doQuery(9, callback);
    }
], function(err, results){
    console.log("done,", err, results);
    var exec = require('child_process').exec;
    // exec('(echo 'year,2014,2015';(paste -d"  " 20142 20152 | awk '{print "\""$1"\"" ","$3","$6}' ) ) > data.csv
    var command = '(sort 2014 | uniq > 20142);(sort 2015 | uniq > 20152);(echo \'year,year2014,year2015\';(paste -d"  " 20142 20152 | awk \'{print "\\""$1"\\"" ","$3","$6}\' ) ) > data-'+city.englishName+'.csv';
    exec(command, function(err, stdout,stderr){
        if(!stderr){
            exec('rm 201*');
        }
        console.log(err, stdout, stderr);
    });
});
//doQuery(1);
