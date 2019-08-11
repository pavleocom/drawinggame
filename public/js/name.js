var playerNameForm = document.getElementById('player-name-form');

playerNameForm.addEventListener('submit', selectPlayerName);

function selectPlayerName(event) {
    event.preventDefault();
    var playerNameInput = document.getElementById('player-name-input');

    //TODO validate name
    var playerName = playerNameInput.value;

    document.cookie = 'playerName=' + playerName;

    window.location.href = '/';
}