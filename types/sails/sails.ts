
type SailsLogFunc = (...data) => void;

// it's possible to make this instead an interface and use the " (...data): Function; " hack, but this uglifies Intellisense in some IDEs
// (and using the .log() directly is potentially a bad practice anyway)
abstract class SailsLog {

  silent: SailsLogFunc;
  error: SailsLogFunc;
  warn: SailsLogFunc;
  debug: SailsLogFunc;
  info: SailsLogFunc;
  verbose: SailsLogFunc;
  silly: SailsLogFunc;

}

abstract class SailsSockets {

  /**
   * Subscribe all members of a room to one or more additional rooms.
   *
   * @param sourceRoom - The room to retrieve members from.
   * @param destRooms - The room or rooms to subscribe the members of sourceRoom to.
   * @param cb - An optional callback which will be called when the operation is complete on the current
   * server, or if fatal errors were encountered. In the case of errors, it will be called with a single
   * argument (err).
   */
  abstract addRoomMembersToRooms(sourceRoom: string, destRooms: string | string[], cb?: (err?: any) => void): void;

  /**
   * Broadcast a message to all sockets connected to the server (or any server in the cluster, if you
   * have a multi-server deployment using Redis).
   *
   * @param eventName - Optional. Defaults to 'message'.
   * @param data - The data to send in the message.
   * @param socketToOmit - Optional. If provided, the socket associated with this socket request will
   * not receive the message blasted out to everyone else. Useful when the broadcast-worthy event is
   * triggered by a requesting user who doesn't need to hear about it again.
   */
  abstract blast(eventName?: string, data?: Object, socketToOmit?: any): void;

  /**
   * Broadcast a message to all sockets in a room (or to a particular socket).
   *
   * @param roomNames - The name of one or more rooms to broadcast a message in. To broadcast to
   * individual sockets, use their IDs as room names.
   * @param eventName - Optional. The unique name of the event used by the client to identify this
   * message. Defaults to 'message'.
   * @param data - The data to send in the message.
   * @param socketToOmit - Optional. If provided, the socket belonging to the specified socket request
   * will not receive the message. This is useful if you trigger the broadcast from a client, but don't
   * want that client to receive the message itself (for example, sending a message to everybody else
   * in a chat room).
   */
  abstract broadcast(roomNames: string | string[], eventName?: string, data?: Object, socketToOmit?: any): void;

  /**
   * Parse the socket ID from an incoming socket request (req).
   *
   * @param req - A socket request.
   */
  abstract getId(req: any): string;

  /**
   * Subscribe a socket to a room.
   *
   * @param socket - The socket to be subscribed. May be specified by the socket's id or an incoming
   * socket request (req).
   * @param roomName - The name of the room to which the socket will be subscribed. If the room does
   * not exist yet, it will be created.
   * @param cb - An optional callback which will be called when the operation is complete on the current
   * server, or if fatal errors were encountered. In the case of errors, it will be called with a single
   * argument (err).
   */
  abstract join(socket: string | any, roomName: string, cb?: (err?: any) => void): void;

  /**
   * Unsubscribe a socket from a room.
   *
   * @param socket - The socket to be unsubscribed. May be either the incoming socket request (req) or
   * the id of another socket.
   * @param roomName - The name of the room from which the socket will be unsubscribed.
   * @param cb - An optional callback which will be called when the operation is complete on the current
   * server, or if fatal errors were encountered. In the case of errors, it will be called with a single
   * argument (err).
   */
  abstract leave(socket: string | any, roomName: string, cb?: (err?: any) => void): void;

  /**
   * Unsubscribe all members of a room (e.g. chatroom7) from that room and every other room they are
   * currently subscribed to; except the automatic room associated with their socket ID.
   *
   * @param roomName - The room to evactuate. Note that this room's members will be forced to leave all
   * of their rooms, not just this one.
   * @param cb - An optional callback which will be called when the operation is complete on the current
   * server, or if fatal errors were encountered. In the case of errors, it will be called with a single
   * argument (err).
   */
  abstract leaveAll(roomName: string, cb?: (err?: any) => void): void;

  /**
   * Unsubscribe all members of a room from one or more other rooms.
   *
   * @param sourceRoom - The room to retrieve members from.
   * @param destRooms - The room or rooms to unsubscribe the members of sourceRoom from.
   * @param cb - An optional callback which will be called when the operation is complete on the current
   * server, or if fatal errors were encountered. In the case of errors, it will be called with a single
   * argument (err).
   */
  abstract removeRoomMembersFromRooms(sourceRoom: string, destRooms: string | string[], cb?: (err?: any) => void): void;

}

export declare interface sails {

  log: SailsLog;

  sockets: SailsSockets;

}
