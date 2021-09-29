import json
import os

import pandas as pd
import spacy
from joblib import dump
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_selection import RFECV, SelectKBest, mutual_info_classif
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer
from spacy.pipeline.functions import merge_entities
from tqdm import tqdm

tqdm.pandas()
DATASET_PATH = "data"
LEGAL_DOCS_PATH = os.path.join(DATASET_PATH, "legal_docs.json")
NON_LEGAL_DOCS_PATH = os.path.join(DATASET_PATH, "nonlegal_docs.json")


def load_dataset():
    legal_docs_texts = json.load(open(LEGAL_DOCS_PATH, "r")).values()
    nonlegal_docs_texts = json.load(open(NON_LEGAL_DOCS_PATH, "r")).values()

    nonlegal_docs_texts
    df = pd.DataFrame(
        [{"text": text, "label": 1} for text in legal_docs_texts]
        + [{"text": text, "label": 0} for text in nonlegal_docs_texts]
    )
    return df


nlp = spacy.load("en_core_web_sm")


def get_processed_words(doc):
    words = [
        t.ent_type_ if t.ent_type_ else t.lemma_.lower()
        for t in doc
        if not t.is_stop and (t.is_alpha or t.ent_type_)
    ]
    joined_words = " ".join(words)
    return joined_words


def preprocess_text(texts):
    d = texts.str.replace("\n", " ")
    d = d.str.replace(" +", " ")
    docs = d.progress_apply(nlp)
    docs = docs.progress_apply(merge_entities)
    out_texts = docs.progress_apply(get_processed_words)
    return out_texts


if __name__ == "__main__":
    df = load_dataset()
    train, test = train_test_split(df, stratify=df.label, random_state=123)
    text_preprocessing = FunctionTransformer(func=preprocess_text)

    mutual_info_selector = SelectKBest(mutual_info_classif, k=10000)
    recurse_importance_selector = RFECV(
        estimator=LogisticRegression(penalty="l1", solver="saga"),
        min_features_to_select=20,
        n_jobs=-1,
        verbose=True,
        step=10,
    )
    classifier = LogisticRegression(penalty="l2")

    pipeline = Pipeline(
        [
            (
                "preprocessing",
                Pipeline(
                    [
                        ("text_processor", text_preprocessing),
                        ("count_vectorizer", CountVectorizer()),
                    ]
                ),
            ),
            (
                "feature_selection",
                Pipeline(
                    [
                        ("mutual_info_selector", mutual_info_selector),
                        ("recurse_importance_selector", recurse_importance_selector),
                    ]
                ),
            ),
            ("classifier", classifier),
        ]
    )

    X_train = train.text
    y_train = train.label

    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_train)

    print("Train acc:", accuracy_score(y_train, y_pred))
    X_test = test.text
    y_test = test.label

    pred_test = pipeline.predict(X_test)

    print("Test acc:", accuracy_score(y_test, pred_test))

    dump(pipeline, "data/classification_pipeline.joblib")
