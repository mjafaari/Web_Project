var validator = 0;

var socket = io('http://localhost:3000', {
    'query': 'token='
    + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Im1vanRhYmFAamFmYXJpLmNvbSIsIm5hbWUiOiJtb2p0YWJhQGphZmFyaS5jb20iLCJhdmF0YXIiOjEsImlhdCI6MTYxMzgxODY4OH0.sbPnorHr3UAo9DrRlsyjY-mSNHV2TZzymJVqQT8ZGdk'
    // + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Imd1ZXN0MTkiLCJuYW1lIjoiZ3Vlc3QxOSIsImF2YXRhciI6MSwiaWF0IjoxNTY2MDQzMDE5fQ.sOEs3d6DN7noi1g_2O6OpIU7Iia1oJQzyDlce3aMLlI'
        // + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Imd1ZXN0NTMiLCJuYW1lIjoiZ3Vlc3Q1MyIsImF2YXRhciI6MSwiaWF0IjoxNTY2MDQ4MjAyfQ.C1RyJiOZ18k9C9mwUMJdVSpqku3oEBY58rN0GbxGxAg'
});
// var socket = io('http://localhost:3000', {
//     'query': 'token='
//     + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Imd1ZXN0MjMiLCJuYW1lIjoiZ3Vlc3QyMyIsImF2YXRhciI6MSwiaWF0IjoxNjEzODI1MjAyfQ.FP2kFZk4-ByKdiFXv_hl9ajaVDFYkKTWdn4fGQg7iY4'
//     // + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Imd1ZXN0MTkiLCJuYW1lIjoiZ3Vlc3QxOSIsImF2YXRhciI6MSwiaWF0IjoxNTY2MDQzMDE5fQ.sOEs3d6DN7noi1g_2O6OpIU7Iia1oJQzyDlce3aMLlI'
//     //     + 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Imd1ZXN0NTMiLCJuYW1lIjoiZ3Vlc3Q1MyIsImF2YXRhciI6MSwiaWF0IjoxNTY2MDQ4MjAyfQ.C1RyJiOZ18k9C9mwUMJdVSpqku3oEBY58rN0GbxGxAg'
// });

function b64(e) {
    var t = "";
    var n = new Uint8Array(e);
    var r = n.byteLength;
    for (var i = 0; i < r; i++) {
        t += String.fromCharCode(n[i])
    }
    return window.btoa(t)
}

function send_match() {
    socket.emit('match_request', {
        username: $('#input').val(),
        category: $('#topic').val()
    });
}

socket.on('match_request_answer', (res) => {
    console.log(res)
});

socket.on('match_opponent_ready', (res) => {
    console.log(res);
    if ($('#input').val() === res.players[0].username)
        $('#opponent').val(res.players[1].username);
    else
        $('#opponent').val(res.players[0].username);

    let q = res.question;
    $('#questions').val(q.desc);
});
//
// socket.on('match_opponent_ready', (res) => {
//     console.log(res);
//     if ($('#input').val() === res.username_1)
//         $('#opponent').val(res.username_2);
//     else
//         $('#opponent').val(res.username_1);
//
//     let q = res.question;
//     $('#questions').val('{ question: ' + q.desc + ' }');
//     $('#img').attr("src","data:image/png;base64,"+b64(q.image.data));
// });

socket.on('connection_confirm', (res) => {
    console.log(res)
});

socket.on('answer_validation', (res) => {
    if (res.player === $('#input').val()) {
        if (res.validation === validator) {
            $('#self_progress').val($('#self_progress').val() + 'T');
        } else {
            $('#self_progress').val($('#self_progress').val() + 'F');
        }
    } else {
        $('#op_progress').val($('#op_progress').val() + 'H');
    }
});

socket.on('next_question', (res) => {
    $('#questions').val('{ question: ' + res.question.desc + ' }');
});

socket.on('match_over', (res) => {
    $('#result').val(res.result);
    $('#img').attr("src", "");
});

socket.on('question limit exceeded', () => {
    console.log('illegal')
});

function submit() {
    validator = Math.ceil(Math.random() * 100);
    socket.emit('question_solved', {
        answer: $('#answer').val(),
        player: $('#input').val(),
        validator: validator
    })
}