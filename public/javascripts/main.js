(function($, moment) {
  $(function() {
    var peer = new Peer(chance.name(), {
      host: '65d283d5.ngrok.io',
      port: 80,
      path: '/broker'
    });
    
    peer.on('open', function(id) {
      $('.client-name').text(id);
      $('.app-input').on('submit', function(e) {
        e.preventDefault();
        var _this = this;
        peer.listAllPeers(function(peers) {
          var message = {};
          message.body = $(_this).find('.input-field').val();
          message.peer = id;
          message.time = moment().format('h:mm A');                  
          $(_this).find('.input-field').val('');
          peers.splice(peers.indexOf(id), 1);
          addMessage(message);
          sendMessage(peers, message);
        });
      });
    });
    
    peer.on('connection', function(conn) {
      conn.on('data', function(data) {
        addMessage(data);
      });
    });
    
    $('.app-messages').on('click', '.app-message .peer-name', function() {
      $('.app-input .input-field').val('@' + $(this).text() + ': ' + $('.app-input .input-field').val()).focus();
    });
    
    setInterval(function() {
      peer.listAllPeers(function(peers) {
        $('.peer-count').text(peers.length + ' People Connected');
      });
    }, 1000);
    
    function sendMessage(peers, message) {
      if(!message.body.trim()) {
        return;
      }
      peers.forEach(function(_peer) {
        var conn = peer.connect(_peer);
        conn.on('open', function() {
          conn.send(message);
        });
      });
    }
    
    function addMessage(message) {
        if(!message.body.trim()) {
          return;
        }
        var peerMessage = $('<div class="app-message"><div class="time"></div><div class="peer-name"></div><div class="peer-message"></div></div>');
        peerMessage.find('.time').text(message.time);
        peerMessage.find('.peer-name').text(message.peer);
        peerMessage.find('.peer-message').text(message.body);
        $('.app-messages').append(textToRichText(peerMessage));
        $('body').scrollTop($('body').prop('scrollHeight'));          
    }

    function textToRichText(message) {
      var newStr = (function(str) {
        var syntaxMap = [
          {
            match: /</g,
            replace: '&lt;'
          }, {
            match: />/g,
            replace: '&gt;'
          },

          {
            match: /_(.+)_/g,
            replace: '<i class="parser">$1</i>'
          }, {
            match: /\*(.+)\*/g,
            replace: '<b class="parser">$1</b>'
          }, {
            match: /`(.+)`/g,
            replace: '<pre><code>$1</code></pre>'
          }, {
            match: /~(.+)~/g,
            replace: '<s class="parser">$1</s>'
          }, {
            match: /(https?:\/\/([-\w\.]+)+(:\d+)?(\/([\w\/_\.]*(\?\S+)?)?)?)/ig,
            replace: "<a href='$1' target='_blank'>$1</a>"
          }
        ];

        var processedStr = str;
        syntaxMap.forEach(function(item) {
          processedStr = processedStr.replace(item.match, item.replace);
        });

        return processedStr;
      }(message.find('.peer-message').html()));
      message.find('.peer-message').html(newStr);
      return message;
    }
  });
}(jQuery, moment));