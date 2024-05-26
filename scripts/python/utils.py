import base64

def encode_CID_to_2_bytes_32(CID):
    #encode to bytes
    bts = CID.encode()
    #convert to base 64
    b64str = base64.b64encode(bts)
    #split in 32 bytes strings
    part1 = b64str[:32]
    part2 = b64str[32:]
    return [part1, part2]


def decode_2_bytes_32_to_CID(part1, part2):

    return base64.b64decode(part1+part2).decode()
