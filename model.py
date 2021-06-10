import json
import pandas as pd
from datetime import datetime
from nltk import tokenize
from operator import itemgetter
import math
from collections import Counter
import string
import spacy
import en_core_web_sm
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import difflib
import re

THESE_ARE_YOURS_ = '-- Out of these topics, these are yours: '
nltk.download('all'
nlp = en_core_web_sm.load()
punctuations = string.punctuation
stop_words = ['אני',
              'את',
              'אתה',
              'אנחנו',
              'אתן',
              'אתם',
              'הם',
              'הן',
              'היא',
              'הוא',
              'שלי',
              'שלו',
              'שלך',
              'שלה',
              'שלנו',
              'שלכם',
              'שלכן',
              'שלהם',
              'שלהן',
              'לי',
              'לו',
              'לה',
              'לנו',
              'לכם',
              'לכן',
              'להם',
              'להן',
              'אותה',
              'אותו',
              'זה',
              'זאת',
              'אלה',
              'אלו',
              'תחת',
              'מתחת',
              'מעל',
              'בין',
              'עם',
              'עד',
              'נגר',
              'על',
              'אל',
              'מול',
              'של',
              'אצל',
              'כמו',
              'אחר',
              'אותו',
              'בלי',
              'לפני',
              'אחרי',
              'מאחורי',
              'עלי',
              'עליו',
              'עליה',
              'עליך',
              'עלינו',
              'עליכם',
              'לעיכן',
              'עליהם',
              'עליהן',
              'כל',
              'כולם',
              'כולן',
              'כך',
              'ככה',
              'כזה',
              'זה',
              'זות',
              'אותי',
              'אותה',
              'אותם',
              'אותך',
              'אותו',
              'אותן',
              'אותנו',
              'ואת',
              'את',
              'אתכם',
              'אתכן',
              'איתי',
              'איתו',
              'איתך',
              'איתה',
              'איתם',
              'איתן',
              'איתנו',
              'איתכם',
              'איתכן',
              'יהיה',
              'תהיה',
              'היתי',
              'היתה',
              'היה',
              'להיות',
              'עצמי',
              'עצמו',
              'עצמה',
              'עצמם',
              'עצמן',
              'עצמנו',
              'עצמהם',
              'עצמהן',
              'מי',
              'מה',
              'איפה',
              'היכן',
              'במקום שבו',
              'אם',
              'לאן',
              'למקום שבו',
              'מקום בו',
              'איזה',
              'מהיכן',
              'איך',
              'כיצד',
              'באיזו מידה',
              'מתי',
              'בשעה ש',
              'כאשר',
              'כש',
              'למרות',
              'לפני',
              'אחרי',
              'מאיזו סיבה',
              'הסיבה שבגללה',
              'למה',
              'מדוע',
              'לאיזו תכלית',
              'כי',
              'יש',
              'אין',
              'אך',
              'מנין',
              'מאין',
              'מאיפה',
              'יכל',
              'יכלה',
              'יכלו',
              'יכול',
              'יכולה',
              'יכולים',
              'יכולות',
              'יוכלו',
              'יוכל',
              'מסוגל',
              'לא',
              'רק',
              'אולי',
              'אין',
              'לאו',
              'אי',
              'כלל',
              'נגד',
              'אם',
              'עם',
              'אל',
              'אלה',
              'אלו',
              'אף',
              'על',
              'מעל',
              'מתחת',
              'מצד',
              'בשביל',
              'לבין',
              'באמצע',
              'בתוך',
              'דרך',
              'מבעד',
              'באמצעות',
              'למעלה',
              'למטה',
              'מחוץ',
              'מן',
              'לעבר',
              'מכאן',
              'כאן',
              'הנה',
              'הרי',
              'פה',
              'שם',
              'אך',
              'ברם',
              'שוב',
              'אבל',
              'מבלי',
              'בלי',
              'מלבד',
              'רק',
              'בגלל',
              'מכיוון',
              'עד',
              'אשר',
              'ואילו',
              'למרות',
              'אס',
              'כמו',
              'כפי',
              'אז',
              'אחרי',
              'כן',
              'לכן',
              'לפיכך',
              'מאד',
              'עז',
              'מעט',
              'מעטים',
              'במידה',
              'שוב',
              'יותר',
              'מדי',
              'גם',
              'כן',
              'נו',
              'אחר',
              'אחרת',
              'אחרים',
              'אחרות',
              'אשר',
              'או']

def clean_br(text):
    return text.replace('\n', ' ').replace('/n', ' ')


def check_sent(word, sentences):
    final = [all([w in x for w in word]) for x in sentences]
    sent_len = [sentences[i] for i in range(0, len(final)) if final[i]]
    return int(len(sent_len))


def compute_entities_delta(a, b):
    a_parsed = nlp(clean_br(a))
    b_parsed = nlp(clean_br(b))
    a_named_entities = [(X.text, X.label_) for X in a_parsed.ents]
    b_named_entities = [(X.text, X.label_) for X in b_parsed.ents]
    diff_new = [(t[0].replace('  ', ''), t[1])
                for t in list(set(b_named_entities) - set(a_named_entities)) if t[0] != ' ']
    diff_old = [(t[0].replace('  ', ''), t[1])
                for t in list(set(a_named_entities) - set(b_named_entities)) if t[0] != ' ']
    inter = [(t[0].replace('  ', ''), t[1])
             for t in list(set(b_named_entities).intersection(set(a_named_entities))) if t[0] != ' ']
    return diff_new, diff_old, inter


def extract_main_words(doc, n):
    total_words = doc.split()
    total_word_length = len(total_words)
    #     print(total_word_length)

    total_sentences = tokenize.sent_tokenize(doc)
    total_sent_len = len(total_sentences)
    #     print(total_sent_len)

    tf_score = {}
    for each_word in total_words:
        each_word = each_word.replace('.', '').replace('-', '').replace(',', '').replace('(', '').replace(')', '')
        if each_word == '': continue
        if each_word not in stop_words:
            if each_word in tf_score:
                tf_score[each_word] += 1
            else:
                tf_score[each_word] = 1
    tf_score.update((x, y / int(total_word_length)) for x, y in tf_score.items())
    #     print(tf_score)

    idf_score = {}
    for each_word in total_words:
        each_word = each_word.replace('.', '')
        if each_word not in stop_words:
            if each_word in idf_score:
                idf_score[each_word] = check_sent(each_word, total_sentences)
            else:
                idf_score[each_word] = 1

    idf_score.update((x, math.log(int(total_sent_len) / y)) for x, y in idf_score.items())
    #     print(idf_score)
    tf_idf_score = {key: tf_score[key] * idf_score.get(key, 0) * 100 for key in tf_score.keys()}
    #     print(tf_idf_score)
    return dict(sorted(tf_idf_score.items(), key=itemgetter(1), reverse=True)[:n])


def compute_main_words_delta(a, b, n):
    a_key_words = extract_main_words(a, n)
    b_key_words = extract_main_words(b, n)
    diff_new = [t for t in list(set(b_key_words.keys()) - set(a_key_words.keys())) if t and t[0] != ' ']
    diff_new_imp = {}
    print(a_key_words)
    print(b_key_words)
    for t in diff_new:
        diff_new_imp[t] = b_key_words[t]
    diff_old = [t for t in list(set(a_key_words.keys()) - set(b_key_words.keys())) if t and t[0] != ' ']
    diff_old_imp = {}
    for t in diff_old:
        diff_old_imp[t] = a_key_words[t]
    inter = [t for t in list(set(b_key_words.keys()).intersection(set(a_key_words.keys()))) if t and t[0] != ' ']
    inter_imp = {}
    for t in inter:
        inter_imp[t] = a_key_words[t] + b_key_words[t]
    return diff_new_imp, diff_old_imp, inter_imp


def top_sentence(text, limit):
    keyword = []
    pos_tag = ['PROPN', 'ADJ', 'NOUN', 'VERB']
    doc = nlp(text.lower())
    for token in doc:
        if (token.text in stop_words or token.text in punctuations):
            continue
        if (token.pos_ in pos_tag):
            keyword.append(token.text)

    freq_word = Counter(keyword)
    max_freq = Counter(keyword).most_common(1)[0][1]
    for w in freq_word:
        freq_word[w] = (freq_word[w] / float(max_freq))

    sent_strength = {}
    for sent in doc.sents:
        for word in sent:
            if word.text in freq_word.keys():
                if sent in sent_strength.keys():
                    sent_strength[sent] += freq_word[word.text]
                else:
                    sent_strength[sent] = freq_word[word.text]

    summary = []

    sorted_x = sorted(sent_strength.items(), key=lambda kv: kv[1], reverse=True)

    counter = 0
    for i in range(len(sorted_x)):
        summary.append(str(sorted_x[i][0]).capitalize())
        counter += 1
        if (counter >= limit):
            break
    return ' '.join(summary)


def get_user_topics(known_interactions):
    user_topics = {}
    d = difflib.Differ()
    for user in users:
        user_topics[user] = {'my': {}}
        print('-----------------', user, '------------------')
        major_revs = known_interactions[(known_interactions['UserID'] == user) & (df['MajorRevision'])]
        last_rev = major_revs.index[0]
        for rev in major_revs.index:
            if rev == last_rev:
                continue
            doc = known_interactions.iloc[rev]['CurrentDoc']
            last_version = max(known_interactions[last_rev:rev][known_interactions['UserID'] != user].index)
            prev_doc = known_interactions.iloc[last_version]['CurrentDoc']
            delta_text = ' '.join(
                [li.replace('+ ', '') for li in d.compare(prev_doc.split(), doc.split()) if li[0] == '+'])
            delta_text_topics = extract_main_words(delta_text, 50)
            current_topics = extract_main_words(doc, 50)
            my_topics = {t: current_topics[t] for t in current_topics if t in delta_text_topics}
            for t in my_topics:
                if t in user_topics[user]['my']:
                    user_topics[user]['my'][t] += my_topics[t]
                else:
                    user_topics[user]['my'][t] = my_topics[t]
            last_rev = rev
    return user_topics


def analyze_version_with_users_and_topics(curr_iteration, user_main_topics):
    json_output = {}
    now = datetime.now()
    timestamp_model = datetime.timestamp(now)
    last_version = curr_iteration - 1
    last_user = df['UserID'][last_version]
    last_user_name = last_user
    new_text = clean_br(df['CurrentDoc'][last_version])
    new_summary = top_sentence(new_text, 1)
    par_num_new = df['CurrentDoc'][last_version].count('\n\n')
    row_num_new = df['CurrentDoc'][last_version].replace('\n\n', '').count('\n')
    topics = extract_main_words(new_text, 25)
    print('The current version of the document was created by', last_user_name, ' in ',
          df['Timestamp'][last_version])
    json_output['timestamp'] = timestamp_model
    json_output['current version'] = {}
    json_output['current version']['current_user_id'] = last_user_name
    json_output['current version']['current_version_date'] = str(df['Timestamp'][last_version])
    print('The current version in a few words: ' + new_summary)
    json_output['current version']['current_version_summary'] = new_summary
    print('The current version topics: ')
    print(topics)
    json_output['current version']['current_version_topic'] = topics
    locations = {}
    for topic in topics:
        locations[topic] = []
        occurrences = [m.start() for m in re.finditer(topic, new_text)]
        for o in occurrences:
            end = new_text.find('.', o, -1)
            start = new_text.rfind('.', 0, o)
            if start == -1: start = 0
            locations[topic] += [(start, end)]
    json_output['current version']['current_version_topics_locations'] = locations
    for curr_user in user_main_topics:
        json_output['document_id'] = curr_user
        json_output[curr_user] = {'id': curr_user}
        curr_user_name = curr_user
        json_output[curr_user]['user_name'] = curr_user_name
        last_visits = [visit for visit in df[df['UserID'] == curr_user].index if visit < last_version]
        if len(last_visits) > 0:
            last_visit = max(last_visits)
        else:
            print('Nothing changed')
            continue
        old_text = clean_br(df['CurrentDoc'][last_visit])
        old_summary = top_sentence(old_text, 1)
        print('\t---------------' + str(last_version) + '->' + str(last_visit) + '---------------')
        json_output[curr_user]['last_visit_id'] = last_visit
        print(curr_user_name, ' the last version you created is from', df['Timestamp'][last_visit])
        json_output[curr_user]['last_visit_date'] = str(df['Timestamp'][last_visit])
        json_output[curr_user]['is_last_version_subset_of_current'] = False
        if old_text in new_text:
            print('The last version you know is subsumed in the current version')
            print('The original test begins at index: ', new_text.find(old_text))
            json_output[curr_user]['is_last_version_subset_of_current'] = True
        minor_revisions = last_version - last_visit
        major_revisions = len(df[last_visit:last_version][df['MajorRevision']])
        unique_users = len(df[last_visit:last_version]['UserID'].unique())
        print('Since the last vesrsion there were ' + str(minor_revisions) + ' minor revisions and ' +
              str(major_revisions) + ' major revisions made by ' + str(unique_users) + ' diffrent users')
        json_output[curr_user]['minor_revisions_count'] = minor_revisions
        json_output[curr_user]['major_revisions_count'] = major_revisions
        json_output[curr_user]['editing_users_since_last_count'] = unique_users
        par_num_old = df['CurrentDoc'][last_visit].count('\n\n')
        row_num_old = df['CurrentDoc'][last_visit].replace('\n\n', '').count('\n')
        json_output[curr_user]['chars_diff_count'] = len(new_text) - len(old_text)
        json_output[curr_user]['word_diff_count'] = new_text.count(' ') - old_text.count(' ')
        json_output[curr_user]['row_diff_count'] = row_num_new - row_num_old
        json_output[curr_user]['paragraph_diff_count'] = par_num_new - par_num_old
        if old_summary == new_summary:
            print('---Summary Unchanged---')
        else:
            print('Old Text Summary: ' + old_summary)
        print()
        json_output[curr_user]['old_version_summary'] = old_summary
        user_topics = user_main_topics[curr_user]['my']
        users_topics_in_doc = list(set(topics).intersection(set(user_topics)))
        if len(users_topics_in_doc) == 0:
            print('---None of your topics are in the top 25 current topics---')
        diff_new, diff_old, inter = compute_main_words_delta(old_text, new_text, 50)
        users_topics_in_diff_new = {t: diff_new[t] * user_topics[t] for t in
                                    list(set(diff_new).intersection(set(user_topics)))}
        users_topics_in_diff_old = {t: diff_old[t] * user_topics[t] for t in
                                    list(set(diff_old).intersection(set(user_topics)))}
        users_topics_in_inter = {t: inter[t] * user_topics[t] for t in
                                 list(set(inter).intersection(set(user_topics)))}
        json_output[curr_user]['new_topics'] = diff_new
        json_output[curr_user]['users_topics_in_new_topics'] = users_topics_in_diff_new
        if len(diff_new) == 0:
            print('---No new topics---')
        else:
            print('- New topics in the document: ' + str(diff_new))
            print(THESE_ARE_YOURS_, str(users_topics_in_diff_new))
        print()
        json_output[curr_user]['replaced_topics'] = diff_old
        json_output[curr_user]['users_topics_in_replaced_topics'] = users_topics_in_diff_old
        if len(diff_old) == 0:
            print('---All main topics remained in this vesrion---')
        else:
            print('- Replaced topics: ' + str(diff_old))
            print(THESE_ARE_YOURS_, str(users_topics_in_diff_old))
        print()
        json_output[curr_user]['withstanding_topics'] = inter
        json_output[curr_user]['users_topics_in_withstanding_topics'] = users_topics_in_inter
        if len(inter) == 0:
            print('---All main topics were changed---')
        else:
            print('- Withstanding topics: ' + str(inter))
            print(THESE_ARE_YOURS_, str(users_topics_in_inter))
        print()
    with open('output.json', 'w') as outfile:
        json.dump(json_output, outfile, ensure_ascii=False)
    return json_output


client = MongoClient("mongodb+srv://modeluser:YQIicZ9bFv0HbzQ0@situ.usjub.mongodb.net/situ?retryWrites=true&w=majority")

try:
    client.admin.command('ismaster')
except ConnectionFailure:
    print("Server not available")
client.server_info()

mydb = client["situ"]
mycol = mydb["doc_events"]

full_revisions = {'EventID': [], 'DocID': [], 'UserID': [], 'Timestamp': [], 'CurrentDoc': []}
for doc in mycol.find():
    if 'timestamp' in doc:
        full_revisions['EventID'] += [doc['_id'], ]
        full_revisions['DocID'] += [doc['documentId'], ]
        full_revisions['UserID'] += [doc['hashedUserId'], ]
        full_revisions['Timestamp'] += [doc['timestamp'], ]
        full_revisions['CurrentDoc'] += [doc['text'], ]
df = pd.DataFrame(full_revisions)
df['MajorRevision'] = False
df.loc[df['UserID'] != df['UserID'].shift(-1), 'MajorRevision'] = True
df['CurrentDoc'] = df['CurrentDoc'].str.replace("revision*", "", regex=True)

users_lst = list(df['UserID'].unique())
users = dict(zip(users_lst, [[]] * len(users_lst)))
known_interactions = df[:]
user_topics = get_user_topics(known_interactions)
user_main_topics = user_topics
curr_iteration = 10
out = analyze_version_with_users_and_topics(curr_iteration, user_main_topics)
mycol = mydb["output"]
mycol.insert_one(out)
