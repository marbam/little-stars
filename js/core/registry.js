// Games and packs register themselves here. See README.md for how to add a new pack.
window.LS = window.LS || {};

LS.games = {};
LS.packs = [];

/**
 * Register a game.
 *   id:     unique string
 *   title:  shown on the tile and spoken when hovered
 *   icon:   an emoji for the tile
 *   colour: tile/accent colour
 *   stars:  how many stars finish the game (0 = the game calls api.finish() itself)
 *   start(stage, api): builds the game inside `stage`; may return a cleanup function
 */
LS.registerGame = function (game) {
    LS.games[game.id] = game;
};

/**
 * Register a pack (a group of games shown together on the menu).
 *   id, title, icon, colour
 *   ages:  heading the pack is grouped under, e.g. 'Under 5s'
 *   games: list of game ids
 */
LS.registerPack = function (pack) {
    LS.packs.push(pack);
};
