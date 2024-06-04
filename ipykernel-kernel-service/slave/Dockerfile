FROM python:3.11-bookworm
LABEL authors="srijan"

WORKDIR /slave

COPY requirements.txt .

EXPOSE 5000

RUN pip install -r requirements.txt

RUN python -m ipykernel install --user

ENV PYDEVD_DISABLE_FILE_VALIDATION 1

COPY run.sh .
RUN chmod +x run.sh

COPY app app/

WORKDIR /home

ENTRYPOINT ["bash", "/slave/run.sh"]
