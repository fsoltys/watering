#include <pthread.h>

#include "serv.h"
#include "recver.h"
#include "logger.h"

handle_packet dispatch_table[256] = {
  [READ_RUNNING_SLOT_CMD]   = get_running_slot_handle,
  [SET_ACTIVE_SLOT_CMD]     = generic_zerolen_resp,
  [FLASH_WRITE_CMD]         = generic_zerolen_resp,
  [FLASH_ERASE_CMD]         = generic_zerolen_resp,
};

  void
dispatch(packet_t *packet, int client_fd, uint32_t size)
{
  int i;

  for (i=0; i<pico_count; i++) {
    if (pico_ctxs[i].fd == client_fd) {
      break;
    }
  }

  if (i == pico_count) {
    log_err("Can't find pico fd in table\n");
    return;
  }

  if (pico_ctxs[i].last_msg_id != packet->header.msg_id) {
    log_warn("Got unexpected message id\n");
    return;
  }

  if (packet->header.length != size - sizeof(header_t)) {
    log_warn("Size is equal to : %d, expected : %d\n",
            packet->header.length, size - sizeof(header_t));
    return;
  }

  const uint8_t cmd_ack = packet->header.cmd_ack;

  if (IS_ERR_ACK(cmd_ack)) {
    // TBD, how we handle wrong ack
    log_info("Got error header: %02X\n", packet->header.cmd_ack);
    return;
  }

  if (dispatch_table[cmd_ack] == NULL) {
    log_warn("Got unknown ack value\n");
    return;
  }

  if (dispatch_table[cmd_ack](packet, &pico_ctxs[i])) {
    log_warn("Error during dispatch of message\n");
    return;
  }

  if (pico_ctxs[i].packet_callback == NULL) {
    log_info("Packet callback is none");
    return;
  }

  if (pico_ctxs[i].packet_callback(packet, &pico_ctxs[i])) {
    log_err("Error during callback of message\n");
    return;
  }
}

  int
get_running_slot_handle(packet_t *in_packet, pico_ctx_t *pico_ctx) 
{
  if (in_packet->header.length != sizeof(read_running_slot_resp_t)) {
    log_warn("Length is not the length of valid response\n");
    return -1;
  }

  const read_running_slot_resp_t *resp = &(in_packet->data.read_running_slot);

  pico_ctx->cur_slot_id = resp->slot_id;
  pico_ctx->slot_to_update = resp->slot_id == 0 ? 1 : 0;

  return 0;
}
  
  int
generic_zerolen_resp(packet_t *in_packet, pico_ctx_t *pico_ctx)
{
  if (in_packet->header.length != 0) {
    log_warn("Length is not the length of valid response\n");
    return -1;
  }

  return 0;
}

static void
parse_packet(intern_packet_t *pack)
{
  dispatch(&pack->pack, pack->fd, pack->size);
}

void *
recv_main(void *args)
{
  intern_packet_t *buf_pack;
  intern_packet_t cur_pack;

  while (0xDEADBEEF)
  {
    pthread_mutex_lock(&packet_buf_mutex);
    while((buf_pack = packet_ringbuf_pop()) == NULL) {          // To be sure we don't get the spurious wakeup
      pthread_cond_wait(&packet_buf_cond, &packet_buf_mutex);
    }
    memcpy(&cur_pack, buf_pack, sizeof(packet_t));

    pthread_mutex_unlock(&packet_buf_mutex);

    parse_packet(&cur_pack);
  }
}
