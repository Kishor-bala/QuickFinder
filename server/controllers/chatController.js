const chatService = require('../services/chatService');

exports.sendMessageRequest = async (req, res, next) => {
  try {
    const { recipient_id, report_id, initial_message } = req.body;
    const request = await chatService.sendMessageRequest({
      sender_id: req.user.id,
      recipient_id,
      report_id,
      initial_message,
    });
    res.status(201).json({ request });
  } catch (err) {
    next(err);
  }
};

exports.respondToMessageRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body;
    const result = await chatService.respondToMessageRequest(requestId, req.user.id, action);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { convId } = req.params;
    const { text, attachmentUrl } = req.body;
    const message = await chatService.sendMessage(convId, req.user.id, text, attachmentUrl);
    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
};

exports.getChatOverview = async (req, res, next) => {
  try {
    const overview = await chatService.getUserChatOverview(req.user.id);
    res.status(200).json(overview);
  } catch (err) {
    next(err);
  }
};
