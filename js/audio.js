;

String.prototype.trim = function() { 
  return this.replace(/^\s+|\s+$/g, '');
}

var Audio = {
  
  data: {},
  
  startBefore: 0,
  state: 0,

  init: function(offset) {
    VK.api('audio.get', {count: 100, offset:offset*100}, function(r) {
      var response = r.response;
      if(response.length == 0) {
        Audio.sort();
      } else {
        for(var i in response) {
          var audio = response[i];
          if(Audio.startBefore == 0)
            Audio.startBefore = audio.aid;

          var key = audio.artist.trim().toLowerCase();
          if(!Audio.data[key])
            Audio.data[key] = [];
          Audio.data[key].push(audio);
        }
        setTimeout(function() {
          Audio.init(offset+1);
        }, 500);
      }
    });
  },

  sort: function() {

    var keys = Object.keys(Audio.data), len = keys.length;

    keys.sort();

    var newArray = [];
    for (var i = 0; i < len; i++) {
      var key = keys[i];
      var arr = Audio.data[key];
      arr.sort(function(a, b) {

        var title1 = a.title.toLowerCase();
        var title2 = b.title.toLowerCase();

        if ( title1 < title2 )
          return -1;
        if ( title1 > title2 )
          return 1;
        return 0;
      });
      newArray.push(arr);
    }

    Audio.data = newArray;
    console.log(Audio.data[0][0]);
    var aid = Audio.data[0][0].aid;
    delete Audio.data[0][0];

    VK.api('audio.reorder', {
      aid: aid,
      before: Audio.startBefore
    }, function(r) {
      Audio.swithAudio();
    });
    
  },

  before: 0,

  swithAudio: function() {

    if(Audio.data.length == 0) {
      Audio.state = 2
      document.getElementById('loading-button').innerHTML = Consts.finishString
      return;
    }
    //console.log(Audio.data);

    var execute = [];
    var count = 0;
    var before = 0;
    for(var i in Audio.data) {
      for(var j in Audio.data[i]) {
        execute.push(Audio.data[i][j].aid);
        before = Audio.data[i][j].aid;
        //console.log(Audio.data[i][j]);
        delete Audio.data[i][j];
        count++;
        if(count == 25) 
          break;
      }
      if(count == 25) 
        break;
      delete Audio.data[i];
    }

    if(execute.length == 0) {
      Audio.state = 2
      document.getElementById('loading-button').innerHTML = Consts.finishString
      return;
    }

    // var code = '
    //  var arr = [];
    //  var before = '+Audio.before+';
    //  var i = 0;
    //  while(i < arr.length) {
    //    API.audio.reorder({aid:arr[i], before:before});
    //    before = arr[i];
    //    i = i + 1;
    //  }
    //  return 1;
    // ';
    var code = 'var arr = ['+execute.join(',')+']; var before = '+Audio.before+'; var i = 0; while(i < arr.length) { API.audio.reorder({aid:arr[i], after:before}); before = arr[i]; i = i + 1; } return 1;';
    Audio.before = before;
    VK.api('execute', {code: code}, function(r) {
      setTimeout(Audio.swithAudio, 500);
    });
  },

  onClick: function() {
    if (Audio.state == 0) {
      Audio.state = 1
      document.getElementById('loading-button').innerHTML = '<div id="loading" class="bugs_search_progress" style="display:block; margin: 0; margin: auto; height: 10px"></div>'

      VK.init(function() { 
        Audio.init(0);
      }); 
    }

    if (Audio.state == 2) {
      window.open("//vk.com/audio")
    }
  }
} 
