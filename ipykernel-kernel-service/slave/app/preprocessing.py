import os

import pandas as pd
from functools import reduce
from sklearn.model_selection import train_test_split, learning_curve, LearningCurveDisplay
from sklearn.linear_model import LinearRegression
import matplotlib.pyplot as plt
import io
import base64
import numpy as np


class DataSource:
    @staticmethod
    def load(filename: str) -> ():
        _, ext = os.path.splitext(filename)
        if ext not in ('.csv', '.json'):
            raise Exception(f"invalid file extension {ext}")

        df: pd.DataFrame | None = None

        if ext == '.csv':
            df = pd.read_csv(filename)
        elif ext == '.json':
            try:
                df = pd.read_json(filename)
            except ValueError:
                df = pd.read_json(filename, lines=True)

        return df, df is not None


class DataModification:
    @staticmethod
    def rename_col(df, initial_col_name: str, fin_col_name: str) -> ():
        try:
            df1 = df.rename(columns={initial_col_name: fin_col_name})

            return df1, True

        except Exception as ex:
            print(type(ex))
            return None, False

    @staticmethod
    def join_dataframe(df_list, field: str) -> ():
        try:
            df_merged = reduce(
                lambda left, right: pd.merge(left, right, on=[field], how="outer"),
                df_list,
            )
            return df_merged, True

        except Exception as ex:
            print(type(ex))
            return None, False

    @staticmethod
    def filter_greater_than(df, key: str, value) -> ():
        try:
            new_df = df[df[key] > value]
            return new_df, True

        except Exception as ex:
            print(type(ex))
            return None, False

    @staticmethod
    def filter_less_than(df, key: str, value) -> ():
        try:
            new_df = df[df[key] < value]
            return new_df, True

        except Exception as ex:
            print(type(ex))
            return None, False

    @staticmethod
    def filter_equal(df, key: str, value) -> ():
        try:
            new_df = df[df[key] == value]
            return new_df, True

        except Exception as ex:
            print(type(ex))
            return None, False


class MachineLearningAlgorithms:
    @staticmethod
    def linear_regression(df, x_cols: list[str], y_cols: str, test_size: float):
        """
        Train-Test split ratio
        Number of epochs
        Learning rate
        Loss function
        Validation split
        Optimizer
        When is normalization required
        Multiple Linear Regression
        Show loss vs epoch and graph with regression line as output
        """
        x = df[x_cols].to_numpy().reshape(-1, 1)
        y = df[y_cols].to_numpy().reshape(-1, 1)
        X_train, X_test, y_train, y_test = train_test_split(x, y, test_size=test_size)  # noqa
        model = LinearRegression()  # noqa
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)

        train_sizes, train_scores, test_scores = learning_curve(estimator=model,
                                                                X=X_train,
                                                                y=y_train)

        plt.rcParams.update({'font.size': 22})
        fig, ax = plt.subplots(nrows=2, ncols=1, figsize=(18, 18))
        ax[0].scatter(X_test, y_test, color="red")
        ax[0].plot(X_test, y_pred, color="blue", linewidth=2)
        ax[0].set_title("Model")
        ax[1].set_title("Learning Curve")
        lc = LearningCurveDisplay(train_sizes=train_sizes, train_scores=train_scores, test_scores=test_scores,
                                  score_name="Score")
        lc.plot(ax[1])
        # ax[1].legend()

        plt_io = io.BytesIO()
        plt.savefig(plt_io, format='jpg')
        plt_io.seek(0)
        pred_output_image = base64.b64encode(plt_io.read()).decode()

        return model, {
            "model_prediction": pred_output_image,
            "score": model.score(X_test, y_test)
        }


class Inference:
    @staticmethod
    def infer(model_detail, inputs):
        return model_detail[0].predict(np.array(inputs).reshape(-1, 1))[0]
