import copy

def replace_at_index(copy_text, index, char):
	list_of_chars = list(copy_text)
	list_of_chars[index] = char
	return "".join(list_of_chars)

with open("qsn_dump.py") as fp:
	all_text = fp.read()

copy_text = copy.deepcopy(all_text)

index = 0
replaced_hindi_index = 0
for char in all_text:
	if ord(char) > 255:
		copy_text = replace_at_index(copy_text, index-replaced_hindi_index, '')
		replaced_hindi_index += 1
		
	index += 1

with open("qsn_dump2.py", 'w') as fp:
	fp.write(copy_text)
