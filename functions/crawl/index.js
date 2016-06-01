function ExpUp(gamestate, xp) {
  //if (gamestate.xp + xp)
}

function rollDie() {
  return Math.floor((Math.random() * 20) + 1);
}

function newMonster(gamestate) {
  var monster = monsters[selectMonster()]
  monster.level = gamestate.player.level
  return monster
}

var monsters = {
  slime: {
    name: "slime",
    hp: 5,
    atk: 3,
    xp: 5
  },
  bat: {
    name: "bat",
    hp: 10,
    atk: 2,
    xp: 8
  },
  turtle: {
    name: "turtle",
    hp: 15,
    atk: 1,
    xp: 10
  },
  golum: {
    name: "golum",
    hp: 30,
    atk: 4,
    xp: 15
  },
  wizard: {
    name: "wizard",
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

exports.handle = function(event, context) {
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
        },
        monsters_defeated: 0
      }
    }
    // starting monsters are always level 1 or 2.
    var mlevel = Math.floor((Math.random() * 2) + 1);
    var player = response.sessionAttributes.gamestate.player
    var monster = newMonster(response.sessionAttributes.gamestate)
    response.sessionAttributes.gamestate.monster = monster 
    var state = "A " + monster.name + ", level " + mlevel + ", approaches. Player has " + player.hp + " H.P. Attack monster or flee?"
    response.response.outputSpeech = {
      type: "PlainText",
      text: "Welcome player. See how long you can survive the horde. " + state
    }
  } else {
    response.sessionAttributes = event.session.attributes
    var player = response.sessionAttributes.gamestate.player
    var monster = response.sessionAttributes.gamestate.monster
    var gamestate = response.sessionAttributes.gamestate

    if (event.request.type === "IntentRequest") {
      var intent = event.request.intent.name

      if (intent === "StatsIntent") {
         response.response.outputSpeech = {
          type: "PlainText",
          text: "Level " + gamestate.level + " player has " + gamestate.hp + " of " + gamestate.max_hp + " H.P., " + gamestate.mp + " of " + gamestate.max_mp + " MP, and " + gamestate.xp + " experience points."
        }
      } else if (intent === "AMAZON.HelpIntent") {
        response.response.outputSpeech = {
          type: "PlainText",
          text: "Monster Crawl is a game in which the player is confronted by monsters and must destroy them, one by one, until the player's death. It is a game of survival, how long the player can last and how high the player can level up. Confronted with a monster, a player may attack or flee by saying, 'attack monster', or 'flee'."
        }
      } else if (intent === "FleeIntent") {
        /* Monster roll versus player roll; offset by player levels */
        if (rollDie() < rollDie() - (monster.level - player.level)) {
          new_monster = newMonster(gamestate)
          response.sessionAttributes.gamestate.monster = new_monster
          response.response.outputSpeech = {
            type: "PlainText",
            text: "Player runs away. New monster appears! A level " + new_monster.level + " " + new_monster.name + " looks at the player threateningly."
          }
        } else {
          response.response.outputSpeech = {
            type: "PlainText",
            text: "Player was unable to run away. Attack monster or flee?"
          }
        }
      } else if (intent === "AttackIntent") {
        var levelup = ""
        var attack = player.atk
        monster.hp -= player.atk
        player.hp -= monster.atk
        if (monster.hp < 1) {
          player.hp += monster.atk
          new_monster = newMonster(gamestate)
          response.sessionAttributes.gamestate.monster = new_monster
          response.sessionAttributes.gamestate.monsters_defeated += 1
          response.sessionAttributes.gamestate.player.xp += monster.xp
          // required points for next level smaller than current amount of xp...
          if ((player.level + 1)*15 < response.sessionAttributes.gamestate.player.xp) {
            player.level += 1
            response.sessionAttributes.gamestate.player.level += 1
            player.max_hp += (25 / player.level)
            response.sessionAttributes.gamestate.player.max_hp = player.max_hp
            player.hp = player.max_hp
            response.sessionAttributes.gamestate.player.hp = player.max_hp
            levelup = "Player has reached level " + player.level + ". "
          }
          response.response.outputSpeech = {
            type: "PlainText",
            text: "Player attacks " + monster.name + ". Monster dies. Player collects " + monster.xp + " experience points. " + levelup + "New monster approaches, level " + new_monster.level + " " + new_monster.name + ". Player has " + player.hp + " H.P. Attack monster or flee?"
          }
        } else {
          var dies = ""
          if (player.hp < 1) {
            dies = " Player dies. Game was played for " + elapsed + " minutes. Player reached level " + player.level + " with " + player.xp + " experience points by defeating " + gamestate.monsters_defeated + " monsters, but was ultimately vanquished. The End."
            //dies = " Player dies. The end."
            response.response.shouldEndSession = true
          }
          response.response.outputSpeech = {
            type: "PlainText",
            text: "Player attacks " + monster.name + " for " + attack + " points. " + monster.name + " attacks player for " + monster.atk + " points. Player has " + player.hp + " H.P." + dies
          }
        }
      } else if (intent === "AMAZON.StopIntent" || intent === "AMAZON.CancelIntent") {
        var endtime = Date.now()
        elapsed = Math.round((endtime - event.session.attributes.start) / 1000 / 60)

        message = "Game was played for " + elapsed + " minutes. Player reached level " + player.level + " with " + player.xp + " experience points by defeating " + gamestate.monsters_defeated + " monsters."
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
