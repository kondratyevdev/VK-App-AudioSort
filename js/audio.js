;

String.prototype.trim = function() {
  return this.replace(/^\s+|\s+$/g, '');
}

var Audio = {

  data: {},
  unsorted: [],

  startBefore: 0,
  state: 0,

  init: function(offset, type) {
    VK.api('audio.get', {
      count: 100,
      offset: offset * 100
    }, function(r) {
      var response = r.response;
      var count = response.count;
      var items = response.items;

      if (items.length == 0) {
        if (type == 'random') {
          Audio.randomSort();
        } else {
          Audio.sort();
        }
      } else {
        console.log(items)
        for (var i in items) {
          var audio = items[i];

          console.log(audio)

          if (Audio.startBefore == 0)
            Audio.startBefore = audio.id;

          var key = audio.artist.trim().toLowerCase();
          if (!Audio.data[key])
            Audio.data[key] = [];
          Audio.data[key].push(audio);
        }
        setTimeout(function() {
          Audio.init(offset + 1, type);
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
      Audio.defaultState();
      document.getElementById('restore-block').innerHTML = Consts.restore
    });

  },

  restore: function(offset) {
   VK.api('audio.get', {
      count: 100,
      offset: offset * 100
    }, function(r) {
      var response = r.response;
      var count = response.count;
      var items = response.items;

      if (items.length == 0) {
        Audio.sortById();
      } else {
        for (var i in items) {
          var audio = items[i];
          Audio.unsorted.push(audio);
        }
        setTimeout(function() {
          Audio.restore(offset + 1);
        }, 500);
      }
    });
  },

  randomSort: function() {
    var keys = Object.keys(Audio.data),
      len = keys.length;

    var audio_array = [];
    var sorted_array = [];

    for (var i = 0; i < len; i++) {
      var key = keys[i];
      var arr = Audio.data[key];

      audio_array = audio_array.concat(arr);
    }

    sorted_array = audio_array.sort(function(a, b) {
      return Math.random() > 0.5 ? 1 : -1;
    });

    Audio.reorder(sorted_array, 0, function() {
      Audio.defaultState();
      document.getElementById('restore-block').innerHTML = Consts.restore
    });
  },

  sortById: function() {
    Audio.unsorted.sort(function(a, b) {
      return b.id - a.id;
    });

    Audio.reorder(Audio.unsorted, 0, function(){
      document.getElementById('restore-block').innerHTML = Consts.ready;
      Audio.defaultState();
    });
  },

  reorder: function(list, offset, cb) {

    if(list.length <= offset) {
      cb();
      return true;
    }

    var execute_list = [];
    var after = list[0].id;

    if(offset !== undefined && offset != 0) {
      after = list[offset - 1].id;
    } else {
      offset = 0
    }

    var chunk = list.slice(offset, offset + 25);

    for(var i = 0; i < chunk.length; i++) {
      execute_list.push(chunk[i].id);
    }

    var code = 'var arr = [' + execute_list.join(",") + ']; var after = ' + after + '; var i = 0; while(i < arr.length) { API.audio.reorder({audio_id: arr[i], after: after}); after = arr[i]; i = i + 1; } return 1;';

    VK.api('execute', {
      code: code
    }, function(r) {
      setTimeout(function() {
        Audio.reorder(list, offset + 25, cb);
      }, 500);
    });
  },

  defaultState: function() {
    Audio.state = 0
    document.getElementById('loading-button-abc').innerHTML = Consts.reorderAbc
    document.getElementById('loading-button-random').innerHTML = Consts.reorderRandom
    document.getElementById('audio-button').innerHTML = Consts.finishString
  },

  loadingState: function() {
    Audio.state = 1;
    document.getElementById('loading-button-abc').innerHTML = Consts.loading
    document.getElementById('loading-button-random').innerHTML = Consts.loading
    document.getElementById('audio-button').innerHTML = ''
  },

  onClick: function(type) {
    if (Audio.state == 0) {
      Audio.loadingState();
      document.getElementById('restore-block').innerHTML = "";
      VK.init(function() {
        Audio.init(0, type);
      });
    }
  },

  onRestore: function() {
    document.getElementById('restore-block').innerHTML = Consts.restoring;
    Audio.loadingState();
    Audio.restore(0);
  }
}
