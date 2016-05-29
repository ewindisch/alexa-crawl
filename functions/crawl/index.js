function ExpUp(gamestate, xp) {
  if (gamestate.xp + xp > 
}

function rollDie() {
  return Math.floor((Math.random() * 20) + 1);
}

function newMonster(gamestate) {
  var monster = monsters[selectMonster()]
  monster.level = gamestate.player.level
}

var monsters = {
  slime: {
    hp: 5,
    atk: 3,
    xp: 5
  },
  bat: {
    hp: 10,
    atk: 2,
    xp: 8
  },
  turtle: {
    hp: 15,
    atk: 1,
    xp: 10
  },
  golum: {
    hp: 30,
    atk: 4,
    xp: 15
  },
  wizard: {
    hp: 10,
    atk: 6,
    xp: 20
  }
}

function selectMonster() {
  var roll = Math.floor((Math.random() * 100) + 1);
  if (roll > -1 && roll < 36) {
    return 'slime'
  } else if (roll > 35 && roll < 66) {
    return 'bat'
  } else if (roll > 65 && roll < 96) {
    return 'turtle'
  } else if (roll > 95 && roll < 99) {
    return 'golum'
  } else if (roll > 98 && roll < 101) {
    return 'wizard'
  }
}

exports.handler = function(event, context) {
  //event.session.sessionId
  var elapsed = 0
  var response = {
    "version": "1.0",
    response: {
      shouldEndSession: false
    }
  }

  if (event.session.new) {
    /* init session: new game */
    response.sessionAttributes = {
      start: Date.now(),
      gamestate: {
        player: {
          level: 1,
          max_hp: 25,
          hp: 25,
          max_mp: 10,
          mp: 10,
          xp: 0,
          atk: 2
        },
        monster: {
          type: null,
          level: null,
          hp: 0,
          mp: 0,
        }
      }
    }
    var state = "A " + monster + ", level " + mlevel + ", approaches. Attack? Flee?"
    response.response.outputSpeech = {
      type: "PlainText",
      text: "Welcome player. See how long you can survive the horde. " + state
    }
  } else {
    response.sessionAttributes = event.session.attributes
    var player = response.sessionAttributes.gamestate.player
    var monster = response.sessionAttributes.gamestate.monster

    if (event.request.type === "IntentRequest") {
      var intent = event.request.intent.name
      var player = parseInt(event.session.attributes.player)

      if (intent === "StatsIntent") {
         response.response.outputSpeech = {
          type: "PlainText",
          text: "Level " + gamestate.level + " player has " + gamestate.hp + " of " + gamestate.max_hp + " HP, " + gamestate.mp + " of " + gamestate.max_mp + " MP, and " + gamestate.xp + " experience points."
        }
      } else if (intent === "FleeIntent") {
        /* Monster roll versus player roll; offset by player levels */
        if (rollDie() < rollDie() - (monster.level - player.level)) {
          response.response.outputSpeech = {
            type: "PlainText",
            text: "Player runs away."
          }
        } else {
          response.response.outputSpeech = {
            type: "PlainText",
            text: "Player was unable to run away. Monster attacks."
          }
        }
      } else if (intent === "AttackIntent") {
        var attack = player.atk
        monster.hp -= player.atk
        if (monster.hp < 1) {
          monster = newMonster()
          response.response.outputSpeech = {
            type: "PlainText",
            text: "Player attacks " + gamestate.monster + ". Monster dies. Player collects " + monster.xp + " experience points. New monster approaches, level " + monster.level + " " + monster.type + ". Attack or flee?"
          }
        } else {
          player.hp -= monster.atk
          response.response.outputSpeech = {
            type: "PlainText",
            text: "Player attacks " + gamestate.monster + " for " + attack + " points. Monster attacks player for " + monster.atk + " points. Player has " + player.hp + " HP."
          }
        }
      } else if (intent === "AMAZON.StopIntent" || intent === "AMAZON.CancelIntent") {
        var endtime = Date.now()
        elapsed = Math.round((endtime - event.session.attributes.start) / 1000 / 60)

        message = "Game was played for " + elapsed + " minutes. Player reached level " + gamestate.level + " with " + gamestate.xp + " experience points by defeating " + gamestate.monsters_defeated + " monsters."
        response.response.outputSpeech = {
          type: "PlainText",
          text: message
        }
        response.response.shouldEndSession = true
      }
    } else if (event.request.type === "SessionEndedRequest") {
        // No-op
    }
  }
  context.succeed(response)
}
