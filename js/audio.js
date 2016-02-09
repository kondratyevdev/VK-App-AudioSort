;

String.prototype.trim = function() {
  return this.replace(/^\s+|\s+$/g, '');
}

var Audio = {

  data: {},
  unsorted: [],

  startBefore: 0,
  state: 0,
  init: function(offset) {
    VK.api('audio.get', {
      count: 100,
      offset: offset * 100
    }, function(r) {
      var response = r.response;
      if (response.length == 0) {
        Audio.sort();
      } else {
        for (var i in response) {
          var audio = response[i];
          if (Audio.startBefore == 0) 
            Audio.startBefore = audio.aid;

          var key = audio.artist.trim().toLowerCase();
          if (!Audio.data[key])
            Audio.data[key] = [];
          Audio.data[key].push(audio);
        }
        setTimeout(function() {
          Audio.init(offset + 1);
        }, 500);
      }
    });
  },

  sort: function() {
    var keys = Object.keys(Audio.data),
      len = keys.length;

    keys.sort();

    var sorted_array = [];

    for (var i = 0; i < len; i++) {
      var key = keys[i];
      var arr = Audio.data[key];

      arr.sort(function(a, b) {
        var title1 = a.title.toLowerCase();
        var title2 = b.title.toLowerCase();

        if (title1 < title2)
          return -1;
        if (title1 > title2)
          return 1;
        return 0;
      });

      sorted_array = sorted_array.concat(arr);
    }

    Audio.reorder(sorted_array, 0, function() {
      Audio.state = 2
      document.getElementById('loading-button').innerHTML = Consts.finishString
      document.getElementById('restore-block').innerHTML = Consts.restore
    });

  },

  restore: function(offset) {
   VK.api('audio.get', {
      count: 100,
      offset: offset * 100
    }, function(r) {
      var response = r.response;
      if (response.length == 0) {
        Audio.sortById();
      } else {
        for (var i in response) {
          var audio = response[i];
          Audio.unsorted.push(audio);
        }
        setTimeout(function() {
          Audio.restore(offset + 1);
        }, 500);
      }
    });
  },

  sortById: function() {
    Audio.unsorted.sort(function(a, b) {
      return b.aid - a.aid;
    });

    Audio.reorder(Audio.unsorted, 0, function(){
      document.getElementById('restore-block').innerHTML = Consts.ready;
      Audio.state = 0;
      document.getElementById('loading-button').innerHTML = Consts.reorder;
    });
  },

  reorder: function(list, offset, cb) {

    if(list.length <= offset) {
      cb();
      return true;
    }
    
    var execute_list = [];
    var after = list[0].aid;

    if(offset !== undefined && offset != 0) {
      after = list[offset - 1].aid;
    } else {
      offset = 0
    }

    var chunk = list.slice(offset, offset + 25);

    for(var i = 0; i < chunk.length; i++) {
      execute_list.push(chunk[i].aid);
    }

    var code = 'var arr = [' + execute_list.join(",") + ']; var after = ' + after + '; var i = 0; while(i < arr.length) { API.audio.reorder({aid:arr[i], after: after}); after = arr[i]; i = i + 1; } return 1;';
  
    VK.api('execute', {
      code: code
    }, function(r) {
      setTimeout(function() {
        Audio.reorder(list, offset + 25, cb);
      }, 500);
    });
  },

  onClick: function() {
    if (Audio.state == 0) {
      Audio.state = 1
      document.getElementById('loading-button').innerHTML = Consts.loading
      document.getElementById('restore-block').innerHTML = "";
      VK.init(function() {
        Audio.init(0);
      });
    }

    if (Audio.state == 2) {
      window.open("//vk.com/audio")
    }
  },

  onRestore: function() {
    document.getElementById('restore-block').innerHTML = Consts.restoring;
    Audio.state = 1;
    document.getElementById('loading-button').innerHTML = Consts.loading
    Audio.restore(0);
  }
}